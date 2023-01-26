export default class Urlscan {
    constructor(url: any, env: any, visibility: any = "unlisted") {
        this.url = url;
        this.visibility = visibility;

        this._endpoint = "https://urlscan.io/api/v1";
        this.env = env;
    }

    async get(id) {
        let u = await fetch(`${this._endpoint}/result/${id}`, {
            cf: {
                cacheEverything: true,
                cacheTtlByStatus: {
                    "200-299": 900,
                    404: 1,
                    "500-599": 0
                }
            }
        })
        u = await u.json()
        return u
    }

    async submit() {
        let u = await fetch(`${this._endpoint}/scan`, {
            method: 'POST',
            body: JSON.stringify({
                'url': this.url,
                'visibility': this.visibility,
                'tags': ['phishing.fyi']
            }),
            headers: {
                'API-Key': this.env.URLSCAN_TOKEN,
                'Content-Type': 'application/json'
            }
        })
        u = await u.json()
        return u
    }
}