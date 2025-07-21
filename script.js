document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const DOM = {
        navButtons: document.querySelectorAll('nav button'),
        contentSections: document.querySelectorAll('.content-section'),
        expenseForm: document.getElementById('expense-form'),
        formMessage: document.getElementById('form-message'),
        expensesTableBody: document.querySelector('#expenses-table tbody'),
        filterMonthInput: document.getElementById('filter-month'),
        totalMonthAmountSpan: document.getElementById('total-month-amount'),
        chartMonthInput: document.getElementById('chart-month'),
        expenseChartCanvas: document.getElementById('expenseChart'),
        expenseDateInput: document.getElementById('expense-date')
    };

    let expenseChartInstance = null; // To hold the Chart.js instance

    // Set default date for input and filters to current month/day
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const currentMonthYear = `${year}-${month}`;

    DOM.expenseDateInput.value = `${year}-${month}-${day}`;
    DOM.filterMonthInput.value = currentMonthYear;
    DOM.chartMonthInput.value = currentMonthYear;

    // --- Helper Functions ---
    const displayMessage = (message, type) => {
        DOM.formMessage.textContent = message;
        DOM.formMessage.className = `message ${type}`;
        setTimeout(() => {
            DOM.formMessage.textContent = '';
            DOM.formMessage.className = 'message';
        }, 3000); // Clear message after 3 seconds
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const fetchData = async (url) => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            displayMessage('Network error or server issue.', 'error');
            return null;
        }
    };

    // --- SPA Router Functionality ---
    const showSection = (sectionId) => {
        DOM.contentSections.forEach(section => section.classList.add('hidden'));
        document.getElementById(sectionId).classList.remove('hidden');

        DOM.navButtons.forEach(button => button.classList.remove('active'));
        document.getElementById(`nav-${sectionId.replace('-section', '')}`).classList.add('active');

        // Load data specific to the section
        if (sectionId === 'view-expenses-section') {
            loadExpenses(DOM.filterMonthInput.value);
        } else if (sectionId === 'view-charts-section') {
            loadExpensesAndRenderCharts(DOM.chartMonthInput.value);
        }
    };

    // --- Expense Form Submission ---
    DOM.expenseForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(DOM.expenseForm);
        const expenseData = Object.fromEntries(formData.entries());
        expenseData.amount = parseFloat(expenseData.amount);

        try {
            const response = await fetch('add_expense.php', {
                method: 'POST',
                body: JSON.stringify(expenseData),
                headers: { 'Content-Type': 'application/json' }
            });
            const result = await response.json();

            if (result.status === 'success') {
                displayMessage('Expense added successfully!', 'success');
                DOM.expenseForm.reset();
                DOM.expenseDateInput.value = `${year}-${month}-${day}`; // Reset date input
            } else {
                displayMessage(result.message || 'Failed to add expense.', 'error');
            }
        } catch (error) {
            console.error('Error adding expense:', error);
            displayMessage('Network error or server issue.', 'error');
        }
    });

    // --- Load and Display Expenses ---
    const loadExpenses = async (selectedMonth) => {
        DOM.expensesTableBody.innerHTML = '<tr><td colspan="4">Loading expenses...</td></tr>';
        DOM.totalMonthAmountSpan.textContent = '₹0.00';

        const [yearFilter, monthFilter] = selectedMonth.split('-');
        const url = `get_expense.php?month=${monthFilter}&year=${yearFilter}`;
        const expenses = await fetchData(url);

        DOM.expensesTableBody.innerHTML = ''; // Clear previous entries
        let totalAmount = 0;

        if (!expenses || expenses.length === 0) {
            DOM.expensesTableBody.innerHTML = '<tr><td colspan="4">No expenses found for this period.</td></tr>';
        } else {
            expenses.forEach(expense => {
                const row = DOM.expensesTableBody.insertRow();
                row.insertCell(0).textContent = formatDate(expense.expense_date);
                row.insertCell(1).textContent = expense.category;
                row.insertCell(2).textContent = `₹${parseFloat(expense.amount).toFixed(2)}`;
                row.insertCell(3).textContent = expense.description || '-';
                totalAmount += parseFloat(expense.amount);
            });
        }
        DOM.totalMonthAmountSpan.textContent = `₹${totalAmount.toFixed(2)}`;
    };

    // --- Chart Rendering ---
    const loadExpensesAndRenderCharts = async (selectedMonth) => {
        const [yearChart, monthChart] = selectedMonth.split('-');
        const url = `get_expense.php?month=${monthChart}&year=${yearChart}`;
        const expenses = await fetchData(url);

        const categoryData = {};
        let totalAmount = 0;

        if (expenses) {
            expenses.forEach(expense => {
                const amount = parseFloat(expense.amount);
                const category = expense.category;
                categoryData[category] = (categoryData[category] || 0) + amount;
                totalAmount += amount;
            });
        }

        DOM.totalMonthAmountSpan.textContent = `₹${totalAmount.toFixed(2)}`;
        renderChart(categoryData);
    };

    const renderChart = (data) => {
        const categories = Object.keys(data);
        const amounts = Object.values(data);

        if (expenseChartInstance) {
            expenseChartInstance.destroy(); // Destroy previous chart instance
        }

        expenseChartInstance = new Chart(DOM.expenseChartCanvas, {
            type: 'pie',
            data: {
                labels: categories,
                datasets: [{
                    data: amounts,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9933', '#C9CBCF'
                    ],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(context.parsed);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    };

    // --- Event Listeners ---
    DOM.navButtons.forEach(button => {
        button.addEventListener('click', () => {
            showSection(button.id.replace('nav-', '') + '-section');
        });
    });

    DOM.filterMonthInput.addEventListener('change', () => loadExpenses(DOM.filterMonthInput.value));
    DOM.chartMonthInput.addEventListener('change', () => loadExpensesAndRenderCharts(DOM.chartMonthInput.value));

    // --- Initial Load ---
    showSection('add-expense-section'); // Start on the Add Expense tab
});