// SPA-style navigation using hash
window.addEventListener('hashchange', renderPage);
window.addEventListener('DOMContentLoaded', renderPage);

function renderPage() {
  const app = document.getElementById('app');
  const page = location.hash.replace('#', '') || 'home';
  switch (page) {
    case 'home':
      app.innerHTML = `<h1>Welcome to Library System</h1>
        <p>Quick stats: <span id="stats"></span></p>`;
      // Show stats (stub for now)
      document.getElementById('stats').innerText = "Books: 0 | Members: 0";
      break;
    case 'books':
      app.innerHTML = `<h2>Book Management</h2>
        <button onclick="addBook()">Add Book</button>
        <ul id="bookList"></ul>`;
      renderBooks();
      break;
    case 'members':
      app.innerHTML = `<h2>Member Management</h2>
        <button onclick="addMember()">Add Member</button>
        <ul id="memberList"></ul>`;
      renderMembers();
      break;
    case 'reports':
      app.innerHTML = `<h2>Reports</h2>
        <p>Analytics coming soon...</p>`;
      break;
    default:
      app.innerHTML = <h2>Page Not Found</h2>;
  }
}

// Book management, localStorage stubs
function addBook() {
  let books = JSON.parse(localStorage.getItem('books') || '[]');
  books.push({ title: "New Book", author: "Unknown", date: new Date().toISOString() });
  localStorage.setItem('books', JSON.stringify(books));
  renderBooks();
}

function renderBooks() {
  let books = JSON.parse(localStorage.getItem('books') || '[]');
  const list = document.getElementById('bookList');
  if (!list) return;
  list.innerHTML = books.map((b, i) =>
    `<li>${b.title} by ${b.author} 
      <button onclick="deleteBook(${i})">Delete</button>
    </li>`
  ).join('');
}

function deleteBook(index) {
  let books = JSON.parse(localStorage.getItem('books') || '[]');
  books.splice(index, 1);
  localStorage.setItem('books', JSON.stringify(books));
  renderBooks();
}

// Member management, localStorage stubs
function addMember() {
  let members = JSON.parse(localStorage.getItem('members') || '[]');
  members.push({ name: "New Member", role: "User" });
  localStorage.setItem('members', JSON.stringify(members));
  renderMembers();
}

function renderMembers() {
  let members = JSON.parse(localStorage.getItem('members') || '[]');
  const list = document.getElementById('memberList');
  if (!list) return;
  list.innerHTML = members.map((m, i) =>
    `<li>${m.name} (${m.role}) 
      <button onclick="deleteMember(${i})">Delete</button>
    </li>`
  ).join('');
}

function deleteMember(index) {
  let members = JSON.parse(localStorage.getItem('members') || '[]');
  members.splice(index, 1);
  localStorage.setItem('members', JSON.stringify(members));
  renderMembers();
}