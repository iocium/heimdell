export default class SMTP2GO {
    constructor(email: any, variables: any, env: any) {
        this.email = email;
        this.variables = variables;

        this._endpoint = "https://api.smtp2go.com/v3"
        this.env = env;
    }

    async send() {
        let payload = {
            "api_key": this.env.SMTP2GO_TOKEN,
            "to": [this.email],
            "sender": `${this.variables.id}@report.phishing.fyi`,
            "subject": `[Notice] Phishing detected on your infrastructure (${this.variables.id})`,
            "custom_headers": [{
                "header": "Reply-To",
                "value": "reports@phishing.fyi"
            }],
            "template_id": "3828092",
            "template_data": {
                "url": this.variables.url.replaceAll('.', '[.]'),
                "urlscan": this.variables.urlscan.result,
                "dns": this.variables.dns.join(',')
            }
        }

        let data: any = await fetch(`${this._endpoint}/email/send`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        data = await data.json();
        return data;
    }
}