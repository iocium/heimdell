export default class Mailgun {
    constructor(token, domain) {
        this.token = token
        this.domain = domain

        this._auth = btoa(`api:${this.token}`)
        this._endpoint = `https://api.mailgun.net/v3/${this.domain}/messages`
    }

    async send(uuid, to, variables, template = 'phishing_detected') {
        let from = `${uuid}@${this.domain}`

        // formData
        let formData = new FormData();
        formData.append('from', `phishing.fyi <${from}>`);
        formData.append('to', to);
        formData.append('subject', `[${uuid}] phishing.fyi: Phishing detected`);
        formData.append('template', template);
        formData.append('h:X-Mailgun-Variables', JSON.stringify(variables));

        let p = await fetch(this._endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${this._auth}`
            },
            body: formData
        });
        p = await p.json();
        return p
    }
}