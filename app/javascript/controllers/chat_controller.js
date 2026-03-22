import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="chat"
export default class extends Controller {
  static targets = [ "prompt", "conversation" ]
  connect() {
  }

 generateResponse(event) {
    event.preventDefault();

    const prompt = this.promptTarget.value; // 先にプロンプトを取得

    // ユーザーのメッセージを会話に追加
    const userMessage = document.createElement("div");
    userMessage.textContent = prompt;
    this.conversationTarget.appendChild(userMessage);

    // チャットのレスポンスを表示する要素を作成
    const assistantMessage = document.createElement("div");
    this.assistantMessage = assistantMessage; // インスタンス変数に保存
    this.conversationTarget.appendChild(assistantMessage);

    this.#streamAssistantResponse(prompt).catch(e => console.error("ストリーミングエラー:", e)); // レスポンスのストリーミングを開始

    this.promptTarget.value = ""; // 入力フィールドをクリア
 }

 async #streamAssistantResponse(prompt) {
  const csrfToken = document.querySelector("meta[name='csrf-token']").getAttribute("content");
  const response = await fetch("/chats", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken
    },
      body: JSON.stringify({ prompt })
    });
    console.log("response:", response);

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if(!value) continue;
      const lines = decoder.decode(value).trim().split("\n");
      console.log("受信した行:", lines);
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const raw = line.slice(6);
          try {
            const parsedData = JSON.parse(raw);
            this.assistantMessage.textContent += parsedData.message; // レスポンスをチャットに追加
          } catch (error) {
            console.error("JSONパースエラー:", error);
          }
        }
      }
    }
  }
}