const fetch = require('node-fetch')
const express = require('express')
const ogs = require('open-graph-scraper');
const app = express()

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

app.use(express.static('public'))

async function load() {
    const tweetsWithLinks = [];
    const response = await fetch(
        'https://api.twitter.com/1.1/lists/statuses.json?list_id=1225446027190099968&count=30000',
        {
            headers: {
                'Authorization': `Bearer ${process.env.TOKEN}`,
            }
        }
    )
    const json = await response.json()
    json.forEach(tweet => {
        if (tweet.entities.urls.length > 0) {
            if (tweet.entities.urls[0].expanded_url.indexOf('https://twitter.com')  === -1) {
                tweetsWithLinks.push(tweet)
               tweet.score = tweet.retweet_count + tweet.favorite_count
        }
        }
    })
    tweetsWithLinks.sort((a, b) => (a.score > b.score) ? 1 : -1)
    tweetsWithLinks.reverse()
    return tweetsWithLinks.filter(t => {if (t.score > 0) return t}).slice(0,10);
}

app.get('/api/links', async (req, res) => {
    const tweets = await load();
    res.status(200).send({
        success: 'true',
        links: tweets
    })
})

app.get('/api/metadata', async (req, res) => {
    const url = req.query.url

    var options = {'url': url};
    ogs(options, function (error, results) {
        console.log('error:', error); // This is returns true or false. True if there was a error. The error it self is inside the results object.
        console.log('results:', results);
        res.status(200).send({
            success: 'true',
            data: results
        })
      })
})


const PORT = 5000;

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`)
})
