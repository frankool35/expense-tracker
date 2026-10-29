
const currency = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 2,
});

const $ = (selector) => document.querySelector(selector);

let transactions = [];
let overviewChart;
let categoryChart;

const form = $('#transactionForm');
const dialog = $('#transactionDialog');
const transactionList = $('#transactionList');

function formatMoney(amount) {
    return currency.format(Number(amount) || 0);
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    })[character]);
}

function showError(message) {
    const error = $('#formError');
    if (error) {
        error.textContent = message;
        error.hidden = false;
    } else {
        alert(message);
    }
}

function clearError() {
    const error = $('#formError');
    if (error) {
        error.textContent = '';
        error.hidden = true;
    }
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        credentials: 'same-origin',
        ...options,
        headers: {
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...options.headers,
        },
    });

    const result = await response.json().catch(() => ({}));

    if (response.status === 401) {
        window.location.replace('/login.html');
        throw new Error('Please sign in to continue.');
    }

    if (!response.ok || result.success === false) {
        throw new Error(result.message || 'The request could not be completed.');
    }

    return result;
}

async function checkAuthentication() {
    try {
        const result = await apiRequest('/api/auth/me');
        const userName = $('#userName');
        if (userName) userName.textContent = result.user.name;
        return true;
    } catch (error) {
        if (error.message !== 'Please sign in to continue.') {
            console.error(error);
            alert('Unable to verify your session. Please refresh the page.');
        }
        return false;
    }
}


async function loadTransactions() {
    const result = await apiRequest('/api/transactions');

    transactions = Array.isArray(result)
        ? result
        : result.data || result.transactions || [];

    renderDashboard();
    renderFinancialReport();
}


function renderDashboard() {
    const income = transactions
        .filter((item) => item.type === 'income')
        .reduce((total, item) => total + Number(item.amount), 0);

    const expenses = transactions
        .filter((item) => item.type === 'expense')
        .reduce((total, item) => total + Number(item.amount), 0);

    const balance = income - expenses;

    const balanceElement = $('#balance');
    const incomeElement = $('#income');
    const expensesElement = $('#expenses');
    const countElement = $('#transactionCount');

    if (balanceElement) balanceElement.textContent = formatMoney(balance);
    if (incomeElement) incomeElement.textContent = formatMoney(income);
    if (expensesElement) expensesElement.textContent = formatMoney(expenses);
    if (countElement) countElement.textContent = transactions.length;

    renderTransactionList();
    renderCharts();
}

function renderTransactionList() {
    if (!transactionList) return;

    const recentTransactions = [...transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);

    if (!recentTransactions.length) {
        transactionList.innerHTML = `
      <tr>
        <td colspan="6">No transactions yet. Add your first income or expense.</td>
      </tr>`;
        return;
    }

    transactionList.innerHTML = recentTransactions.map((item) => `
    <tr>
      <td>${escapeHTML(item.description)}</td>
      <td>${escapeHTML(item.category)}</td>
      <td>${escapeHTML(new Date(item.date).toLocaleDateString())}</td>
      <td>
        <span class="${item.type === 'income' ? 'income-text' : 'expense-text'}">
          ${escapeHTML(item.type)}
        </span>
      </td>
      <td>${formatMoney(item.amount)}</td>
      <td>
        <button type="button" data-edit="${escapeHTML(item._id)}">Edit</button>
        <button type="button" data-delete="${escapeHTML(item._id)}">Delete</button>
      </td>
    </tr>
  `).join('');
}

function renderCharts() {
    if (typeof Chart === 'undefined') return;

    const monthlyTotals = new Map();

    transactions.forEach((item) => {
        const date = new Date(item.date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyTotals.has(key)) {
            monthlyTotals.set(key, { income: 0, expense: 0 });
        }

        monthlyTotals.get(key)[item.type] += Number(item.amount);
    });

    const months = [...monthlyTotals.keys()].sort();
    const overviewCanvas = $('#overviewChart');

    if (overviewCanvas) {
        if (overviewChart) overviewChart.destroy();

        overviewChart = new Chart(overviewCanvas, {
            type: 'bar',
            data: {
                labels: months.length ? months : ['No data'],
                datasets: [
                    {
                        label: 'Income',
                        data: months.map((month) => monthlyTotals.get(month).income),
                        backgroundColor: '#34d399',
                    },
                    {
                        label: 'Expenses',
                        data: months.map((month) => monthlyTotals.get(month).expense),
                        backgroundColor: '#fb7185',
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
            },
        });
    }

    const categoryCanvas = $('#categoryChart');

    if (categoryCanvas) {
        if (categoryChart) categoryChart.destroy();

        const categoryTotals = {};

        transactions
            .filter((item) => item.type === 'expense')
            .forEach((item) => {
                categoryTotals[item.category] =
                    (categoryTotals[item.category] || 0) + Number(item.amount);
            });

        const categories = Object.keys(categoryTotals);

        categoryChart = new Chart(categoryCanvas, {
            type: 'doughnut',
            data: {
                labels: categories.length ? categories : ['No expenses yet'],
                datasets: [{
                    data: categories.length
                        ? categories.map((category) => categoryTotals[category])
                        : [1],
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
            },
        });
    }
}

function openTransactionDialog(item = null) {
    if (!dialog || !form) return;

    clearError();
    form.reset();

    const existingId = $('#transactionId');
    if (existingId) existingId.value = item?._id || '';

    $('#description').value = item?.description || '';
    $('#type').value = item?.type || 'expense';
    $('#amount').value = item?.amount ?? '';
    $('#category').value = item?.category || '';
    $('#date').value = item
        ? new Date(item.date).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);

    const heading = dialog.querySelector('h2');
    if (heading) heading.textContent = item ? 'Edit Transaction' : 'Add Transaction';

    if (typeof dialog.showModal === 'function') {
        dialog.showModal();
    } else {
        dialog.setAttribute('open', '');
    }
}

function closeTransactionDialog() {
    if (!dialog) return;

    if (typeof dialog.close === 'function' && dialog.open) {
        dialog.close();
    } else {
        dialog.removeAttribute('open');
    }
}

if (form) {
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearError();

        const id = $('#transactionId')?.value;
        const payload = {
            description: $('#description').value.trim(),
            type: $('#type').value,
            amount: Number($('#amount').value),
            category: $('#category').value.trim(),
            date: $('#date').value,
        };

        if (
            !payload.description ||
            !['income', 'expense'].includes(payload.type) ||
            !Number.isFinite(payload.amount) ||
            payload.amount <= 0 ||
            !payload.category ||
            !payload.date
        ) {
            showError('Please complete all fields with valid values.');
            return;
        }

        const submitButton = form.querySelector('[type="submit"]');
        if (submitButton) submitButton.disabled = true;

        try {
            await apiRequest(
                id ? `/api/transactions/${encodeURIComponent(id)}` : '/api/transactions',
                {
                    method: id ? 'PUT' : 'POST',
                    body: JSON.stringify(payload),
                }
            );

            closeTransactionDialog();
            await loadTransactions();
        } catch (error) {
            showError(error.message);
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
}

$('#addTransactionBtn')?.addEventListener('click', () => {
    openTransactionDialog();
});

$('#closeDialog')?.addEventListener('click', closeTransactionDialog);

$('#viewAllBtn')?.addEventListener('click', () => {
    transactionList?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

transactionList?.addEventListener('click', async (event) => {
    const editButton = event.target.closest('[data-edit]');
    const deleteButton = event.target.closest('[data-delete]');

    if (editButton) {
        const item = transactions.find(
            (transaction) => transaction._id === editButton.dataset.edit
        );

        if (item) openTransactionDialog(item);
    }

    if (deleteButton) {
        const id = deleteButton.dataset.delete;

        if (!confirm('Delete this transaction? This action cannot be undone.')) {
            return;
        }

        try {
            await apiRequest(`/api/transactions/${encodeURIComponent(id)}`, {
                method: 'DELETE',
            });
            await loadTransactions();
        } catch (error) {
            alert(error.message);
        }
    }
});

async function startDashboard() {
    const authenticated = await checkAuthentication();
    if (!authenticated) return;

    try {
        await loadTransactions();
    } catch (error) {
        console.error(error);
        alert(`Unable to load transactions: ${error.message}`);
    }
}

const logoutBtn = document.getElementById('logoutBtn');

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await apiRequest('/api/auth/logout', {
                method: 'POST',
            });

            window.location.href = '/login.html';
        } catch (error) {
            alert(error.message || 'Unable to log out. Please try again.');
        }
    });
}


const reportCurrencyFormatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
});

function renderFinancialReport() {
    const monthInput = document.getElementById('reportMonth');
    const incomeElement = document.getElementById('reportIncome');
    const expensesElement = document.getElementById('reportExpenses');
    const savingsElement = document.getElementById('reportSavings');

    if (
        !monthInput ||
        !incomeElement ||
        !expensesElement ||
        !savingsElement
    ) {
        return;
    }

    const selectedMonth = monthInput.value;

    const reportTransactions = selectedMonth
        ? transactions.filter((transaction) => {
            if (!transaction.date) return false;

            const date = new Date(transaction.date);

            if (Number.isNaN(date.getTime())) return false;

            const transactionMonth =
                `${date.getFullYear()}-${String(
                    date.getMonth() + 1
                ).padStart(2, '0')}`;

            return transactionMonth === selectedMonth;
        })
        : transactions;

    const totalIncome = reportTransactions
        .filter((transaction) => transaction.type === 'income')
        .reduce((total, transaction) => total + Number(transaction.amount), 0);

    const totalExpenses = reportTransactions
        .filter((transaction) => transaction.type === 'expense')
        .reduce((total, transaction) => total + Number(transaction.amount), 0);

    incomeElement.textContent =
        reportCurrencyFormatter.format(totalIncome);

    expensesElement.textContent =
        reportCurrencyFormatter.format(totalExpenses);

    savingsElement.textContent =
        reportCurrencyFormatter.format(totalIncome - totalExpenses);
}

const reportMonthInput = document.getElementById('reportMonth');
const resetReportBtn = document.getElementById('resetReportBtn');

if (reportMonthInput) {
    const today = new Date();

    reportMonthInput.value =
        `${today.getFullYear()}-${String(
            today.getMonth() + 1
        ).padStart(2, '0')}`;

    reportMonthInput.addEventListener('change', renderFinancialReport);
}

if (resetReportBtn) {
    resetReportBtn.addEventListener('click', () => {
        if (reportMonthInput) {
            reportMonthInput.value = '';
        }

        renderFinancialReport();
    });
}


startDashboard();



function getReportTransactions() {
    const monthInput = document.getElementById('reportMonth');
    const selectedMonth = monthInput?.value;

    if (!selectedMonth) {
        return [...transactions];
    }

    return transactions.filter((transaction) => {
        if (!transaction.date) return false;

        const date = new Date(transaction.date);
        if (Number.isNaN(date.getTime())) return false;

        const month =
            `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        return month === selectedMonth;
    });
}

function downloadCSV() {
    const reportTransactions = getReportTransactions();

    if (!reportTransactions.length) {
        alert('There are no transactions to export for this period.');
        return;
    }

    const rows = [
        ['Description', 'Type', 'Category', 'Date', 'Amount (NGN)'],
        ...reportTransactions.map((transaction) => [
            transaction.description,
            transaction.type,
            transaction.category,
            transaction.date
                ? new Date(transaction.date).toLocaleDateString('en-GB')
                : '',
            Number(transaction.amount).toFixed(2),
        ]),
    ];

    const csv = rows
        .map((row) =>
            row.map((value) =>
                `"${String(value ?? '').replace(/"/g, '""')}"`
            ).join(',')
        )
        .join('\r\n');

    const blob = new Blob(['\uFEFF' + csv], {
        type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `expense-report-${document.getElementById('reportMonth')?.value || 'all'}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}

function downloadPDF() {
    const reportTransactions = getReportTransactions();

    if (!reportTransactions.length) {
        alert('There are no transactions to include in this report.');
        return;
    }

    const totalIncome = reportTransactions
        .filter((item) => item.type === 'income')
        .reduce((sum, item) => sum + Number(item.amount), 0);

    const totalExpenses = reportTransactions
        .filter((item) => item.type === 'expense')
        .reduce((sum, item) => sum + Number(item.amount), 0);

    const period =
        document.getElementById('reportMonth')?.value || 'All transactions';

    const printWindow = window.open('', '_blank');

    if (!printWindow) {
        alert('Please allow pop-ups for this site to generate your PDF report.');
        return;
    }

    const reportRows = reportTransactions.map((item) => `
        <tr>
            <td>${escapeHTML(item.description)}</td>
            <td>${escapeHTML(item.type)}</td>
            <td>${escapeHTML(item.category)}</td>
            <td>${escapeHTML(item.date ? new Date(item.date).toLocaleDateString('en-GB') : '')}</td>
            <td class="amount">${formatMoney(item.amount)}</td>
        </tr>
    `).join('');

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Expense Tracker Financial Report</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 35px;
                    color: #222;
                }
                h1 { margin-bottom: 5px; }
                .period { color: #555; margin-bottom: 25px; }
                .summary {
                    display: flex;
                    gap: 20px;
                    margin: 20px 0;
                }
                .summary div {
                    flex: 1;
                    padding: 14px;
                    border: 1px solid #ccc;
                    border-radius: 8px;
                }
                .summary strong { display: block; margin-bottom: 8px; }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 25px;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 9px;
                    text-align: left;
                }
                th { background: #f0f0f0; }
                .amount { text-align: right; }
                @media print {
                    body { margin: 15mm; }
                    tr { break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <h1>Expense Tracker</h1>
            <p class="period">Financial Report — ${escapeHTML(period)}</p>

            <section class="summary">
                <div>
                    <strong>Total Income</strong>
                    ${formatMoney(totalIncome)}
                </div>
                <div>
                    <strong>Total Expenses</strong>
                    ${formatMoney(totalExpenses)}
                </div>
                <div>
                    <strong>Net Savings</strong>
                    ${formatMoney(totalIncome - totalExpenses)}
                </div>
            </section>

            <h2>Transaction Details</h2>
            <table>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Type</th>
                        <th>Category</th>
                        <th>Date</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>${reportRows}</tbody>
            </table>

            <p>Generated on ${escapeHTML(new Date().toLocaleDateString('en-GB'))}</p>
            <script>
                window.onload = function () {
                    window.print();
                };
            <\/script>
        </body>
        </html>
    `);

    printWindow.document.close();
}

document.getElementById('exportCsvBtn')
    ?.addEventListener('click', downloadCSV);

document.getElementById('exportPdfBtn')
    ?.addEventListener('click', downloadPDF);
