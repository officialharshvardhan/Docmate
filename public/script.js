const isLoggedIn = localStorage.getItem("isLoggedIn");

  if (isLoggedIn === "true") {
    document.getElementById("login-nav").style.display = "none";
    document.getElementById("profile-nav").style.display = "inline";
    document.getElementById("logout-nav").style.display = "inline";
  }

  function logout() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    window.location.reload(); // Reload to reset navbar
  }

document.getElementById("chatbot-btn").addEventListener("click", function toggleChat() {
    const chat = document.getElementById("chatbot");
    chat.style.display = chat.style.display === "none" ? "flex" : "none";
});
document.getElementById("cross-btn").addEventListener("click", function toggleChat() {
    const chat = document.getElementById("chatbot");
    chat.style.display = chat.style.display === "none" ? "flex" : "none";
});


async function sendMessage() {
  const input = document.getElementById("user-input");
  const userText = input.value.trim();
  if (!userText) return;

  const username = localStorage.getItem("username") || "guest";

  const chatBody = document.getElementById("chat-body");
  chatBody.innerHTML += `<div><strong>You:</strong> ${userText}</div>`;
  input.value = '';

  try {
    const res = await fetch('/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, message: userText })
    });

    const data = await res.json();
    chatBody.innerHTML += `<div><strong>DocMate:</strong> ${data.reply}</div>`;
    chatBody.scrollTop = chatBody.scrollHeight;
  } catch (err) {
    chatBody.innerHTML += `<div><strong>DocMate:</strong> Error connecting to server.</div>`;
  }
}