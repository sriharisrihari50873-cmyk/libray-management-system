document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const root = document.documentElement;

    themeToggle.addEventListener('click', () => {
        root.classList.toggle('dark');
        localStorage.setItem('theme', root.classList.contains('dark') ? 'dark' : 'light');
    });

    if (localStorage.getItem('theme') === 'dark') {
        root.classList.add('dark');
    }

    // A simple, unique ID generator
    const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

    // Get data from Local Storage or initialize empty arrays
    const getBooks = () => JSON.parse(localStorage.getItem('books')) || [];
    const setBooks = (books) => localStorage.setItem('books', JSON.stringify(books));

    const getMembers = () => JSON.parse(localStorage.getItem('members')) || [];
    const setMembers = (members) => localStorage.setItem('members', JSON.stringify(members));

    const getLoans = () => JSON.parse(localStorage.getItem('loans')) || [];
    const setLoans = (loans) => localStorage.setItem('loans', JSON.stringify(loans));
    
    // New: Activity Log
    const getActivities = () => JSON.parse(localStorage.getItem('activities')) || [];
    const setActivities = (activities) => localStorage.setItem('activities', JSON.stringify(activities));

    const logActivity = (message) => {
        const activities = getActivities();
        const now = new Date();
        const activity = {
            id: generateId(),
            message,
            timestamp: now.toISOString()
        };
        activities.unshift(activity); // Add to the beginning
        if (activities.length > 10) activities.pop(); // Keep only the last 10
        setActivities(activities);
    };

    // Common functions for different pages
    const renderBooks = (booksToRender) => {
        const bookList = document.getElementById('book-list');
        const noBooksMessage = document.getElementById('no-books-message');
        if (!bookList) return;

        bookList.innerHTML = '';
        if (booksToRender.length === 0) {
            noBooksMessage.classList.remove('hidden');
        } else {
            noBooksMessage.classList.add('hidden');
            booksToRender.forEach(book => {
                const isAvailable = !getLoans().some(loan => loan.bookId === book.id && !loan.returnDate);
                const statusClass = isAvailable ? 'bg-green-500' : 'bg-red-500';
                const bookCard = `
                    <div class="bg-gray-100 dark:bg-gray-700 p-6 rounded-xl shadow-md flex flex-col justify-between">
                        <div>
                            <h4 class="text-lg font-bold text-gray-900 dark:text-gray-100">${book.title}</h4>
                            <p class="text-sm text-gray-600 dark:text-gray-400">by ${book.author}</p>
                            <p class="text-sm text-gray-600 dark:text-gray-400">Genre: ${book.genre}</p>
                            <p class="text-sm text-gray-600 dark:text-gray-400">Year: ${book.year}</p>
                            <span class="text-xs text-white px-2 py-1 rounded-full inline-block mt-3 ${statusClass}">
                                ${isAvailable ? 'Available' : 'On Loan'}
                            </span>
                        </div>
                        <div class="flex space-x-2 mt-4">
                            <button onclick="editBook('${book.id}')" class="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-bold py-2 rounded-md transition-colors">Edit</button>
                            <button onclick="deleteBook('${book.id}')" class="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-bold py-2 rounded-md transition-colors">Delete</button>
                        </div>
                    </div>
                `;
                bookList.innerHTML += bookCard;
            });
        }
    };

    const renderMembers = (membersToRender) => {
        const memberList = document.getElementById('member-list');
        const noMembersMessage = document.getElementById('no-members-message');
        if (!memberList) return;

        memberList.innerHTML = '';
        if (membersToRender.length === 0) {
            noMembersMessage.classList.remove('hidden');
        } else {
            noMembersMessage.classList.add('hidden');
            membersToRender.forEach(member => {
                const memberCard = `
                    <div class="bg-gray-100 dark:bg-gray-700 p-6 rounded-xl shadow-md flex flex-col justify-between">
                        <div>
                            <h4 class="text-lg font-bold text-gray-900 dark:text-gray-100">${member.name}</h4>
                            <p class="text-sm text-gray-600 dark:text-gray-400">${member.email}</p>
                            <p class="text-sm text-gray-600 dark:text-gray-400">Role: ${member.role}</p>
                        </div>
                        <div class="flex space-x-2 mt-4">
                            <button onclick="editMember('${member.id}')" class="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-bold py-2 rounded-md transition-colors">Edit</button>
                            <button onclick="deleteMember('${member.id}')" class="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-bold py-2 rounded-md transition-colors">Delete</button>
                        </div>
                    </div>
                `;
                memberList.innerHTML += memberCard;
            });
        }
    };
    
    // Index Page Logic
    if (document.getElementById('quick-stats')) {
        const updateStats = () => {
            const books = getBooks();
            const members = getMembers();
            const loans = getLoans();
            
            const issuedBooksCount = loans.filter(loan => !loan.returnDate).length;
            const returnedBooksCount = loans.filter(loan => loan.returnDate).length;
            const availableBooksCount = books.length - issuedBooksCount;
            const overdueBooksCount = loans.filter(loan => {
                const dueDate = new Date(loan.issueDate);
                dueDate.setDate(dueDate.getDate() + 14); // 14-day loan period
                return !loan.returnDate && new Date() > dueDate;
            }).length;
            const activeMembersCount = members.length;
            
            document.getElementById('total-books').textContent = books.length;
            document.getElementById('total-members').textContent = members.length;
            document.getElementById('books-issued').textContent = issuedBooksCount;
            document.getElementById('books-returned').textContent = returnedBooksCount;
            document.getElementById('overview-available-books').textContent = availableBooksCount;
            document.getElementById('overview-overdue-books').textContent = overdueBooksCount;
            document.getElementById('overview-active-members').textContent = activeMembersCount;
        };

        const renderActivities = () => {
            const activityList = document.getElementById('activity-list');
            const noActivitiesMessage = document.getElementById('no-activities-message');
            const activities = getActivities();
            
            if (activities.length === 0) {
                noActivitiesMessage.classList.remove('hidden');
                return;
            } else {
                noActivitiesMessage.classList.add('hidden');
            }

            activityList.innerHTML = '';
            activities.forEach(activity => {
                const timeAgo = (date) => {
                    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
                    let interval = seconds / 31536000;
                    if (interval > 1) return Math.floor(interval) + " years ago";
                    interval = seconds / 2592000;
                    if (interval > 1) return Math.floor(interval) + " months ago";
                    interval = seconds / 86400;
                    if (interval > 1) return Math.floor(interval) + " days ago";
                    interval = seconds / 3600;
                    if (interval > 1) return Math.floor(interval) + " hours ago";
                    interval = seconds / 60;
                    if (interval > 1) return Math.floor(interval) + " minutes ago";
                    return "Just now";
                };
                
                const activityItem = `
                    <li class="activity-item flex justify-between items-center text-gray-700 dark:text-gray-300">
                        <span><i class="fas fa-history mr-2 text-blue-500"></i>${activity.message}</span>
                        <span class="text-xs text-gray-500">${timeAgo(activity.timestamp)}</span>
                    </li>
                `;
                activityList.innerHTML += activityItem;
            });
        };

        updateStats();
        renderActivities();
        window.addEventListener('storage', () => {
            updateStats();
            renderActivities();
        });
        
        // Log a welcome message on first visit
        if (getActivities().length === 0) {
            logActivity('System initialized - Welcome to Library Management!');
            renderActivities();
        }
    }
    
    // Books Page Logic
    if (document.getElementById('book-form')) {
        const bookForm = document.getElementById('book-form');
        const searchBooks = document.getElementById('search-books');
        const filterBooks = document.getElementById('filter-books');
        
        const displayBooks = () => {
            let books = getBooks();
            const searchTerm = searchBooks.value.toLowerCase();
            const filterTerm = filterBooks.value;

            if (searchTerm) {
                books = books.filter(book => 
                    book.title.toLowerCase().includes(searchTerm) || 
                    book.author.toLowerCase().includes(searchTerm)
                );
            }
            if (filterTerm === 'available') {
                const loanedBookIds = getLoans().filter(loan => !loan.returnDate).map(loan => loan.bookId);
                books = books.filter(book => !loanedBookIds.includes(book.id));
            } else if (filterTerm === 'on-loan') {
                const loanedBookIds = getLoans().filter(loan => !loan.returnDate).map(loan => loan.bookId);
                books = books.filter(book => loanedBookIds.includes(book.id));
            }

            renderBooks(books);
        };

        bookForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('book-id').value;
            const title = document.getElementById('book-title').value;
            const author = document.getElementById('book-author').value;
            const genre = document.getElementById('book-genre').value;
            const year = document.getElementById('book-year').value;
            
            let books = getBooks();
            if (id) {
                // Edit existing book
                books = books.map(book => book.id === id ? { id, title, author, genre, year } : book);
            } else {
                // Add new book
                books.push({ id: generateId(), title, author, genre, year });
            }
            setBooks(books);
            bookForm.reset();
            document.getElementById('book-id').value = '';
            displayBooks();
        });

        searchBooks.addEventListener('input', displayBooks);
        filterBooks.addEventListener('change', displayBooks);
        window.editBook = (id) => {
            const book = getBooks().find(b => b.id === id);
            if (book) {
                document.getElementById('book-id').value = book.id;
                document.getElementById('book-title').value = book.title;
                document.getElementById('book-author').value = book.author;
                document.getElementById('book-genre').value = book.genre;
                document.getElementById('book-year').value = book.year;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };
        window.deleteBook = (id) => {
            if (confirm('Are you sure you want to delete this book?')) {
                const books = getBooks().filter(b => b.id !== id);
                setBooks(books);
                // Also remove any loans associated with this book
                const loans = getLoans().filter(loan => loan.bookId !== id);
                setLoans(loans);
                displayBooks();
            }
        };
        displayBooks();
    }

    // Members Page Logic
    if (document.getElementById('member-form')) {
        const memberForm = document.getElementById('member-form');
        
        const displayMembers = () => {
            renderMembers(getMembers());
        };

        memberForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('member-id').value;
            const name = document.getElementById('member-name').value;
            const email = document.getElementById('member-email').value;
            const role = document.getElementById('member-role').value;

            let members = getMembers();
            if (id) {
                // Edit existing member
                members = members.map(member => member.id === id ? { id, name, email, role } : member);
            } else {
                // Add new member
                members.push({ id: generateId(), name, email, role });
            }
            setMembers(members);
            memberForm.reset();
            document.getElementById('member-id').value = '';
            displayMembers();
        });

        window.editMember = (id) => {
            const member = getMembers().find(m => m.id === id);
            if (member) {
                document.getElementById('member-id').value = member.id;
                document.getElementById('member-name').value = member.name;
                document.getElementById('member-email').value = member.email;
                document.getElementById('member-role').value = member.role;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };
        window.deleteMember = (id) => {
            if (confirm('Are you sure you want to delete this member?')) {
                const members = getMembers().filter(m => m.id !== id);
                setMembers(members);
                // Also remove any loans associated with this member
                const loans = getLoans().filter(loan => loan.memberId !== id);
                setLoans(loans);
                displayMembers();
            }
        };
        displayMembers();
    }

    // Issue/Return Page Logic
    if (document.getElementById('issue-form')) {
        const issueForm = document.getElementById('issue-form');
        const bookSelect = document.getElementById('issue-book');
        const memberSelect = document.getElementById('issue-member');
        const loanList = document.getElementById('loan-list');
        const noLoansMessage = document.getElementById('no-loans-message');
        
        const populateSelects = () => {
            const books = getBooks();
            const members = getMembers();
            const loans = getLoans();
            
            bookSelect.innerHTML = '<option value="">-- Select an available book --</option>';
            memberSelect.innerHTML = '<option value="">-- Select a member --</option>';

            const availableBooks = books.filter(book => !loans.some(loan => loan.bookId === book.id && !loan.returnDate));
            availableBooks.forEach(book => {
                const option = document.createElement('option');
                option.value = book.id;
                option.textContent = book.title;
                bookSelect.appendChild(option);
            });

            members.forEach(member => {
                const option = document.createElement('option');
                option.value = member.id;
                option.textContent = member.name;
                memberSelect.appendChild(option);
            });
        };

        const renderLoans = () => {
            const loans = getLoans().filter(loan => !loan.returnDate);
            if (loans.length === 0) {
                noLoansMessage.classList.remove('hidden');
                loanList.innerHTML = '';
            } else {
                noLoansMessage.classList.add('hidden');
                loanList.innerHTML = '';
                loans.forEach(loan => {
                    const book = getBooks().find(b => b.id === loan.bookId) || { title: 'Unknown Book' };
                    const member = getMembers().find(m => m.id === loan.memberId) || { name: 'Unknown Member' };
                    const loanCard = `
                        <div class="bg-gray-100 dark:bg-gray-700 p-6 rounded-xl shadow-md flex flex-col">
                            <h4 class="text-lg font-bold text-gray-900 dark:text-gray-100">${book.title}</h4>
                            <p class="text-sm text-gray-600 dark:text-gray-400">Issued to: ${member.name}</p>
                            <p class="text-sm text-gray-600 dark:text-gray-400">Issued On: ${new Date(loan.issueDate).toLocaleDateString()}</p>
                            <button onclick="returnBook('${loan.id}')" class="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors">Return</button>
                        </div>
                    `;
                    loanList.innerHTML += loanCard;
                });
            }
        };

        issueForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const bookId = bookSelect.value;
            const memberId = memberSelect.value;
            
            if (!bookId || !memberId) return;

            const loans = getLoans();

            loans.push({
                id: generateId(),
                bookId,
                memberId,
                issueDate: new Date().toISOString(),
                returnDate: null
            });
            setLoans(loans);
            logActivity(`Book "${getBooks().find(b => b.id === bookId).title}" issued to ${getMembers().find(m => m.id === memberId).name}.`);
            issueForm.reset();
            populateSelects();
            renderLoans();
        });

        window.returnBook = (loanId) => {
            if (confirm('Are you sure you want to return this book?')) {
                const loans = getLoans();
                const loanIndex = loans.findIndex(loan => loan.id === loanId);
                if (loanIndex !== -1) {
                    loans[loanIndex].returnDate = new Date().toISOString();
                    setLoans(loans);
                    logActivity(`Book "${getBooks().find(b => b.id === loans[loanIndex].bookId).title}" returned by ${getMembers().find(m => m.id === loans[loanIndex].memberId).name}.`);
                    populateSelects();
                    renderLoans();
                }
            }
        };

        populateSelects();
        renderLoans();
    }

    // Reports Page Logic
    if (document.getElementById('book-stats')) {
        const displayReports = () => {
            const books = getBooks();
            const loans = getLoans();
            
            // Book stats
            const totalBooks = books.length;
            const onLoanBooks = loans.filter(loan => !loan.returnDate).length;
            const availableBooks = totalBooks - onLoanBooks;
            document.getElementById('report-total-books').textContent = totalBooks;
            document.getElementById('report-available-books').textContent = availableBooks;
            document.getElementById('report-on-loan-books').textContent = onLoanBooks;
            
            // Popular Books
            const loanCounts = loans.reduce((acc, loan) => {
                acc[loan.bookId] = (acc[loan.bookId] || 0) + 1;
                return acc;
            }, {});
            const sortedBooks = Object.keys(loanCounts).sort((a, b) => loanCounts[b] - loanCounts[a]);
            const popularBooksList = document.getElementById('popular-books-list');
            if (sortedBooks.length === 0) {
                document.getElementById('no-popular-books').classList.remove('hidden');
            } else {
                document.getElementById('no-popular-books').classList.add('hidden');
                popularBooksList.innerHTML = '';
                sortedBooks.slice(0, 5).forEach(bookId => {
                    const book = books.find(b => b.id === bookId);
                    if (book) {
                        const li = document.createElement('li');
                        li.textContent = `${book.title} (Borrowed ${loanCounts[bookId]} times)`;
                        popularBooksList.appendChild(li);
                    }
                });
            }

            // Popular Genres
            const genreCounts = loans.reduce((acc, loan) => {
                const book = books.find(b => b.id === loan.bookId);
                if (book) {
                    acc[book.genre] = (acc[book.genre] || 0) + 1;
                }
                return acc;
            }, {});
            const sortedGenres = Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a]);
            const popularGenresList = document.getElementById('popular-genres-list');
            if (sortedGenres.length === 0) {
                document.getElementById('no-popular-genres').classList.remove('hidden');
            } else {
                document.getElementById('no-popular-genres').classList.add('hidden');
                popularGenresList.innerHTML = '';
                sortedGenres.slice(0, 5).forEach(genre => {
                    const li = document.createElement('li');
                    li.textContent = `${genre} (Borrowed ${genreCounts[genre]} times)`;
                    popularGenresList.appendChild(li);
                });
            }
        };
        displayReports();
    }
});