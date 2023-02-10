// import '@types/google-apps-script'
const discordMsgMaxLen = 2000
export interface mailAttachment {
  getName: () => string
}
export interface mailPayload {
  attachments: mailAttachment[]
  plainBody: string
  date: GoogleAppsScript.Base.Date
  from: string
  to: string
  cc: string
  bcc: string
  subject: string
}
export interface mailMsgHeader {
  attachments: mailAttachment[]
  plainBody: string
}
export interface mailHeader {
  attachments: mailAttachment[]
  date: GoogleAppsScript.Base.Date
  from: string
  to: string
  cc: string
  bcc: string
  subject: string
}
export const msgDescription = (props: mailMsgHeader): string => {
  const headerElems: string[] = ['メッセージが届きました！']
  if (props.attachments.length !== 0) {
    headerElems.push('添付ファイルがあります！メール本体の確認をお忘れなく')
  }
  if (props.plainBody.length >= 1700) {
    headerElems.push(
      '文字数が上限に近づいたので途中で切れている可能性があります。メール本体を確認してください'
    )
  }
  return headerElems.join('\n')
}

export const MailHeader = (header: mailHeader): string => {
  return `[Date] ${header.date.toString()}
[From] ${header.from}
[To] ${header.to}
[Cc] ${header.cc}
[Subject] ${header.subject}
[attachment] ${header.attachments.map(a => a.getName()).join(' ')}
`
}

export const createMsg = (props: mailPayload, maxLen: number): string => {
  const description = msgDescription(props)
  const payload = `MailHeader(props)

${props.plainBody}
`
  // code要素の中の長さをmaxLenギリギリまで詰めるようにする
  // 余裕を持たせて30を追加している。本当はテストで境界を保証したい
  const payloadLen = maxLen - description.length - '\n```txt\n\n```\n'.length - 30
  return `${description}
\`\`\`txt
${payload.substring(0, payloadLen)}
\`\`\`
`
}

// Discord 側へメッセージを送る
function postDiscord (message: string): GoogleAppsScript.URL_Fetch.HTTPResponse {
  const webhookUrl = PropertiesService.getScriptProperties().getProperty(
    'DISCORD_WEBHOOK_URL'
  )
  const payload = {
    username:
      PropertiesService.getScriptProperties().getProperty('WEBHOOK_USERNAME'),
    content: message
  } as const

  return UrlFetchApp.fetch(webhookUrl ?? '', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  })
}

function fetchNewMails (searchCond: string): GoogleAppsScript.Gmail.GmailMessage[] {
  const myThreads = GmailApp.search(searchCond)
  return GmailApp.getMessagesForThreads(myThreads)
    .map(msg => msg.slice(-1)[0])
}
const GmailToPayload = (msg: GoogleAppsScript.Gmail.GmailMessage): mailPayload => {
  return {
    attachments: msg.getAttachments(),
    plainBody: msg.getPlainBody(),
    date: msg.getDate(),
    from: msg.getFrom(),
    to: msg.getTo(),
    cc: msg.getCc(),
    bcc: msg.getBcc(),
    subject: msg.getSubject()
  }
}
export const dateSubsec = (date: Date, subSec: number): Date =>
  new Date(date.getTime() - subSec * 1000)

// メールの検索条件を設定
// 詳しくはここ => https://support.google.com/mail/answer/7190?hl=ja
const mailSearchCond = (curFromUnixSec: number): string =>
  `is:unread after: ${curFromUnixSec}`

// 実行してもらうのはこれ
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function main (): void {
  // 1分おきにトリガーされるので61秒前から検索する
  const newMails = fetchNewMails(
    mailSearchCond(Math.floor(dateSubsec(new Date(), 61).getTime() / 1000))
  )
  for (const mail of newMails.filter(mail => !mail.isDraft()).reverse().map(v => GmailToPayload(v))) {
    postDiscord(createMsg(mail, discordMsgMaxLen))
  }
}
