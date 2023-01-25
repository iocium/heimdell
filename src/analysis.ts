import { nanoid } from 'nanoid';
import { v4 as uuidv4 } from 'uuid';

import AbuseDb from '../enrichment/abusedb';
import Dns from '../enrichment/dns';
import Urlscan from '../enrichment/urlscan';

export default class Analysis {
    constructor(url: any, env: any) {
        this.id = uuidv4();
        this.url = url;
        this.hostname = new URL(this.url).hostname

        this.dns = [];

        this.env = env;
    }

    async run() {

        let resp: any = {
            'id': this.id,
            'url': this.url,
            'hostname': this.hostname
        }

        // First, we have to grab DNS records
        for (let i of ['A', 'AAAA']) {
            let dns: any = new Dns(this.url, i, this.env);
            dns = await dns.lookup();

            if (dns.length > 0) {
                for (let r of dns) {
                    this.dns.push(r);
                }
            }
        }
        this.dns = [...new Set(this.dns)];
        resp.dns = this.dns;

        // Now we have those, let's enrich some abuse information
        let abuse: any = new AbuseDb(this.dns, this.env);
        this.abuse = await abuse.lookup();
        resp.abusedb = this.abuse;

        // Next, we need to check for some other services, but they may need keys
        if (this.env.URLSCAN_TOKEN) {
            let urlscan: any = new Urlscan(this.url, this.env.URLSCAN_TOKEN)
            this.urlscan = await urlscan.submit();
            resp.urlscan = this.urlscan;
        }

        return resp;
    }
}