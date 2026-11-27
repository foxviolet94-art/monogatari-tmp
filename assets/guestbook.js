(() => {
  const project = "https://grfhbtszcrwdbrphaiaw.supabase.co";
  const publishableKey = "sb_publishable_1FoCHLurAbMImr14Vnruaw_xMPoUTa6";
  const form = document.getElementById("guestbook-form");
  const button = form.querySelector("button[type='submit']");
  const fields = Array.from(form.querySelectorAll("[required]"));
  const formStatus = document.getElementById("guestbook-form-status");
  const listStatus = document.getElementById("guestbook-list-status");
  const list = document.getElementById("guestbook-messages");
  const dateFormat = new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeZone: "Asia/Shanghai"
  });
  let submission;

  async function call(operation, method, data) {
    const response = await fetch(`${project}/rest/v1/rpc/monogatari_guestbook_${operation}`, {
      method,
      headers: { apikey: publishableKey, "Content-Type": "application/json" },
      body: data ? JSON.stringify(data) : undefined,
      signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) throw new Error(String(response.status));
    if (method === "GET") return response.json();
  }

  async function showMessages() {
    try {
      const messages = await call("read", "GET");
      const entries = messages.map(({ nickname, message, published_at }) => {
        const entry = document.createElement("li");
        const name = document.createElement("strong");
        const time = document.createElement("time");
        const text = document.createElement("p");
        name.textContent = nickname;
        time.dateTime = published_at;
        time.textContent = dateFormat.format(new Date(published_at));
        text.textContent = message;
        entry.append(name, time, text);
        return entry;
      });
      list.replaceChildren(...entries);
      listStatus.textContent = entries.length ? "" : "暂无公开留言。";
    } catch {
      listStatus.textContent = "暂时读不到留言。刷新页面可以重试。";
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (button.disabled) return;

    const data = new FormData(form);
    const nickname = data.get("nickname").trim();
    const message = data.get("message").trim();
    if (!nickname || !message) {
      formStatus.textContent = "请填写署名和留言。";
      return;
    }
    if (data.get("company")) return;

    if (submission?.p_nickname !== nickname || submission?.p_message !== message) {
      submission = { p_id: crypto.randomUUID(), p_nickname: nickname, p_message: message };
    }
    button.disabled = true;
    fields.forEach((field) => { field.readOnly = true; });
    formStatus.textContent = "正在提交。";
    try {
      await call("submit", "POST", submission);
      form.reset();
      submission = undefined;
      formStatus.textContent = "留言已收到，通过审核后会显示。";
    } catch (error) {
      formStatus.textContent = error.message === "429"
        ? "留言较多，请稍后再试。"
        : "留言暂未提交，请重试。";
    } finally {
      fields.forEach((field) => { field.readOnly = false; });
      button.disabled = false;
    }
  });

  button.disabled = false;
  void showMessages();
})();
