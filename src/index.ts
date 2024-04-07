import { Router } from 'itty-router'
import SMTP2GO from '../senders/smtp2go';
import Analysis from './analysis';
import Package from '../package.json';

const router = Router()
const noContact = [
    'abuse@cloudflare.com'
]

router.get('/report/:id', async (req, env, ctx) => {
    const { params, query } = req

    let resp: any = {
        success: false
    }

    // Now, fetch the report from KV
    let data = await env.KV.get(params.id);
    if (data == null) {
        resp.message = 'That report was not found, or may have expired'
        return new Response(JSON.stringify(resp, null, 2), { headers: { 'Content-Type': 'application/json' }})
    }

    // Now we get our data
    resp.results = JSON.parse(data);

    // And return it
    resp.success = true;
    return new Response(JSON.stringify(resp, null, 2), { headers: { 'Content-Type': 'application/json' }})
})

router.post('/submit', async (req, env, ctx) => {

    let resp: any = {
        'success': false
    }
    let data: any;

    // First, we check if there is a formData payload
    try {
        data = await req.formData();
    }
    catch(e: any) {
        resp.message = "You did not provide any content in which I can action"
        return new Response(JSON.stringify(resp, null, 2), { headers: { 'Content-Type': 'application/json' }})
    }

    // Did they submit a URL variable within formData
    let url = data.get('url', null);
    if (!url) {
        resp.message = "You did not provide a URL, or the URL is not valid"
        return new Response(JSON.stringify(resp, null, 2), { headers: { 'Content-Type': 'application/json' }})
    }

    // And is the URL actually valid?
    try {
        let t: any = new URL(url).hostname
    }
    catch(e: any) {
        resp.message = "You did not provide a URL, or the URL is not valid"
        return new Response(JSON.stringify(resp, null, 2), { headers: { 'Content-Type': 'application/json' }})
    }

    // We're ready to go, so we generate an ID and begin the analysis
    let res: any = new Analysis(url, env);
    res = await res.run();

    // Now, we're done, we need to send some e-mails (but only if we have it enabled)
    if (env.SMTP2GO_TOKEN || env.MAILGUN_TOKEN) {
        // Do we have any e-mails to contact?
        if (res.abusedb.length > 0) {
            // We do, so let's iterate through them
            res.email = {}

            for (let e of res.abusedb) {
                if (noContact.includes(e)) {
                    res.email[e] = {
                        'success': false,
                        'message': `${e} does not support e-mail contact, and has been ignored`
                    }
                }
                else {
                    // We have the e-mail, so let's see what we're using
                    if (env.SMTP2GO_TOKEN && res.urlscan.result) {
                        // We're going to use SMTP2GO
                        let smtp2go: any = new SMTP2GO(e, res, env);
                        smtp2go = await smtp2go.send();

                        if (smtp2go.data.succeeded == 1) {
                            res.email[e] = {
                                'success': true,
                                'message': `Successfully dispatched e-mail to ${e} (#${smtp2go.data.email_id})`
                            }
                        }
                        else {
                            res.email[e] = {
                                'success': false,
                                'message': `Unable to send e-mail to ${e}`
                            }
                        }
                    }
                    else {
                        res.email[e] = {
                            'success': false,
                            'message': `Unable to send e-mail to ${e} as e-mail has been disabled`
                        }
                    }
                }
            }
        }
    }

    // We analysed this successfully, so we prepare our response
    resp.success = true;
    resp.results = res;

    // And now, we save the output to KV
    await env.KV.put(resp.results.id, JSON.stringify(resp));

    return new Response(JSON.stringify(resp, null, 2), { headers: { 'Content-Type': 'application/json' }})
})

router.get('/version', (req, env, ctx) => {
    return new Response(Package.version, {
        headers: {
            'Content-Type': 'text/plain'
        }
    })
})

router.get('/', (req, env, ctx) => {
  return new Response('phishing.fyi: Coming Soon', {
    headers: {
        'Content-Type': 'text/plain'
    }
  })
})

/**
 * DEFAULT ROUTE
 */
router.all('*', () => new Response('Not Found.', { status: 404 }))

export default {
  fetch: router.fetch
}