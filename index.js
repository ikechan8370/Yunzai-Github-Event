import http from 'http'
import crypto from 'crypto'
import common from '../../lib/common/common.js'
import { formatDate, getMasterQQ, render } from './utils/common.js'
const secret = ''
const repos = ['']
const port = 59008
const sendMaster = true
const sendGroups = []
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/github-webhook') {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })
    req.on('end', async () => {
      const signature = req.headers['x-hub-signature']
      const event = req.headers['x-github-event']
      if (!verifySignature(signature, body, secret)) {
        console.error('Signature verification failed!')
        res.writeHead(401)
        res.end('Invalid signature')
        return
      }
      const payload = JSON.parse(body)
      await handleEvent(payload, event)
      res.writeHead(200)
      res.end('OK')
    })
  } else {
    res.writeHead(404)
    res.end('Not found')
  }
})

function verifySignature (signature, payload, secret) {
  const hmac = crypto.createHmac('sha1', secret)
  const digest = Buffer.from(`sha1=${hmac.update(payload).digest('hex')}`, 'utf8')
  const checksum = Buffer.from(signature, 'utf8')
  if (checksum.length !== digest.length || !crypto.timingSafeEqual(digest, checksum)) {
    return false
  }
  return true
}

async function handleEvent (payload, event) {
  console.log({ payload })
  console.log(`Received ${event} event for ${payload.repository.full_name}`)
  const repoName = payload.repository.full_name
  if (repos.indexOf(repoName) === -1) {
    return
  }
  let time = formatDate(new Date())
  // const branch = payload.ref.split('/')[2]
  const repoAvatar = payload.repository.owner.avatar_url
  const description = payload.repository.description
  let bot = Bot
  switch (event) {
    case 'issues': {
      const issueUrl = payload.issue.html_url
      const user = payload.issue.user
      const title = payload.issue.title
      const body = payload.issue.body
      let stateReason
      switch (payload.action) {
        case 'opened': {
          break
        }
        case 'closed': {
          stateReason = payload.issue.state_reason
          break
        }
      }
      let master = await getMasterQQ()
      let res = await render('github', 'github/issues/index', {
        repoAvatar,
        repoName,
        description,
        time,
        action: payload.action,
        issueUrl,
        user: user.login,
        userAvatar: user.avatar_url,
        title,
        body,
        stateReason
      }, { retType: 'base64' })
      
      if (sendMaster) {
        common.relpyPrivate(master, res).catch((err) => {
          logger.error(err)
        })
      }
      sendGroups.forEach(gId => {
        Bot.pickGroup(gId).sendMsg(res).catch((err) => {
          logger.error(err)
        })
      })
      break
    }
    case 'pull_request': {
      const { created_at, updated_at, closed_at, merged_at, url, user, title, body } = payload.pull_request
      let mergedBy
      switch (payload.action) {
        case 'reopened':
        case 'opened': {
          break
        }
        case 'closed': {
          if (payload.pull_request.merged) {
            mergedBy = payload.pull_request.merged_by.login
          }
        }
      }
      let master = await getMasterQQ()
      let res = await render('github', 'github/pr/index', {
        repoAvatar,
        repoName,
        description,
        time,
        action: payload.action,
        prUrl: url,
        user: user.login,
        userAvatar: user.avatar_url,
        title,
        body,
        created_at,
        updated_at,
        closed_at,
        merged: merged_at ? `merged by ${mergedBy} at ${merged_at}` : undefined
      }, { retType: 'base64' })
      if (sendMaster) {
        common.relpyPrivate(master, res).catch((err) => {
          logger.error(err)
        })
      }
      sendGroups.forEach(gId => {
        Bot.pickGroup(gId).sendMsg(res).catch((err) => {
          logger.error(err)
        })
      })
      break
    }
    case 'push': {
      const { name } = payload.pusher
      const commits = payload.commits.map(commit => {
        const { message, author } = commit
        return { message, author: author.name }
      })
      let master = await getMasterQQ()
      let res = await render('github', 'github/push/index', {
        repoAvatar,
        repoName,
        description,
        time,
        pusherName: name,
        commits
      }, { retType: 'base64' })
      if (sendMaster) {
        common.relpyPrivate(master, res).catch((err) => {
          logger.error(err)
        })
      }
      sendGroups.forEach(gId => {
        Bot.pickGroup(gId).sendMsg(res).catch((err) => {
          logger.error(err)
        })
      })
    }
  }
}

server.listen(port, () => {
  logger.mark(`Github hook listen on port ${port}`)
})
