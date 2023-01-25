export default class Dns {
    constructor(url: any, rrtype: any, env: any) {
        this.url = url;
        this.hostname = new URL(this.url).hostname;

        this.rrtype = rrtype.toUpperCase()

        this._data = []
        this._servers = [
            'https://dns.google.com/resolve',
            'https://cloudflare-dns.com/dns-query'
        ]
        this._endpoint = this._servers[Math.floor(Math.random() * this._servers.length)]
    }

    async lookup() {
        if (this._data.length > 0) {
            return this._data
        }

        let d = await fetch(`${this._endpoint}?name=${this.hostname}&type=${this.rrtype}`, {
            headers: {
                'Accept': 'application/dns-json'
            },
            cf: {
                cacheEverything: true,
                cacheTtlByStatus: {
                    "200-299": 900,
                    404: 1,
                    "500-599": 0
                }
            }
        })
        try {
            d = await d.json()
            if (d['Status'] == 0 && d['Answer'].length > 0) {
                for (let r of d['Answer']) {
                    this._data.push(r['data'])
                }
            }
        } catch (e) {}

        return this._data
    }
}