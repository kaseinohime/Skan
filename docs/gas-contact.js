/**
 * エスカン お問い合わせフォーム → Slack 通知 GAS スクリプト
 *
 * 【デプロイ手順】
 * 1. Google Apps Script (https://script.google.com) で新しいプロジェクトを作成
 * 2. このコードを貼り付け、SLACK_WEBHOOK_URL を設定する
 *    （スクリプトプロパティ: [プロジェクトの設定] → [スクリプトのプロパティ] で
 *    キー: SLACK_WEBHOOK_URL、値: Slack Incoming Webhook URL を追加）
 * 3. [デプロイ] → [新しいデプロイ] → 種類: ウェブアプリ
 *    - 次のユーザーとして実行: 自分
 *    - アクセスできるユーザー: 全員
 * 4. デプロイ後に表示される「ウェブアプリの URL」を
 *    .env.local の CONTACT_GAS_URL に設定する
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const company = data.company || "（未入力）";
    const name = data.name || "（未入力）";
    const email = data.email || "（未入力）";
    const message = data.message || "（未入力）";

    const webhookUrl = PropertiesService.getScriptProperties()
      .getProperty("SLACK_WEBHOOK_URL");

    if (!webhookUrl) {
      throw new Error("SLACK_WEBHOOK_URL が設定されていません");
    }

    const payload = {
      text: "📩 新しいお問い合わせが届きました",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "📩 新しいお問い合わせ",
            emoji: true,
          },
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*会社名*\n${company}` },
            { type: "mrkdwn", text: `*お名前*\n${name}` },
            { type: "mrkdwn", text: `*メールアドレス*\n${email}` },
            {
              type: "mrkdwn",
              text: `*受信日時*\n${Utilities.formatDate(
                new Date(),
                "Asia/Tokyo",
                "yyyy/MM/dd HH:mm"
              )}`,
            },
          ],
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*お問い合わせ内容*\n${message}`,
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "返信する" },
              url: `mailto:${email}`,
              style: "primary",
            },
          ],
        },
      ],
    };

    UrlFetchApp.fetch(webhookUrl, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
    });

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: err.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
