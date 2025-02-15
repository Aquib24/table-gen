let currentSchema = null;
let currentTable = null;
let schemas = JSON.parse(localStorage.getItem('schemas')) || [];

// Schema management
function createSchema() {
    const schemaName = document.getElementById('schemaName').value;
    if (!schemaName) return alert('Please enter schema name');
    
    const newSchema = {
        id: Date.now(),
        name: schemaName,
        tables: []
    };
    
    schemas.push(newSchema);
    saveData();
    displaySchemas();
    document.getElementById('schemaName').value = '';
}

// Edit schema
function editSchema(schemaId) {
    const schema = schemas.find(s => s.id === schemaId);
    const newName = prompt('Enter new schema name:', schema.name);
    if (newName) {
        schema.name = newName;
        saveData();
        displaySchemas();
    }
}

// Delete schema
function deleteSchema(schemaId) {
    if (!confirm('Are you sure you want to delete this schema?')) return;
    schemas = schemas.filter(s => s.id !== schemaId);
    saveData();
    displaySchemas();
    showSchemaPage();
}

function showSchemaPage() {
    document.getElementById('schemaPage').style.display = 'block';
    document.getElementById('tablePage').style.display = 'none';
    displaySchemas();
}

// Table management
function initTableCreation() {
    const tableName = document.getElementById('tableName').value;
    if (!tableName) return alert('Please enter table name');
    
    const headerCount = prompt('Enter number of headers:');
    if (!headerCount || isNaN(headerCount)) return;
    
    createTable(tableName, parseInt(headerCount));
}

function createTable(name, headerCount) {
    const newTable = {
        id: Date.now(),
        name: name,
        headers: Array(headerCount).fill().map((_, i) => `Header ${i + 1}`),
        data: [],
        sortState: {}
    };
    
    currentSchema.tables.push(newTable);
    saveData();
    populateTableSelector(); // Refresh the dropdown immediately
    loadTable(newTable.id); // Load the newly created table
    document.getElementById('tableName').value = '';
}

// Edit table
function editTable(tableId) {
    const table = currentSchema.tables.find(t => t.id === tableId);
    const newName = prompt('Enter new table name:', table.name);
    if (newName) {
        table.name = newName;
        saveData();
        populateTableSelector();
    }
}

// Delete table
function deleteTable(tableId) {
    if (!confirm('Are you sure you want to delete this table?')) return;
    currentSchema.tables = currentSchema.tables.filter(t => t.id !== tableId);
    saveData();
    populateTableSelector();
    document.getElementById('tableContainer').innerHTML = ''; // Clear table display
}

// Table operations
function addRow() {
    const newRow = currentTable.headers.map(() => '');
    currentTable.data.push(newRow);
    saveData();
    renderTable();
}

function addHeader() {
    const headerName = prompt('Enter new header name:');
    if (!headerName) return;
    
    currentTable.headers.push(headerName);
    currentTable.data.forEach(row => row.push(''));
    saveData();
    renderTable();
}

function sortTable(headerIndex) {
    const sortState = currentTable.sortState[headerIndex] || 'asc';
    
    currentTable.data.sort((a, b) => {
        const valA = a[headerIndex];
        const valB = b[headerIndex];
        return sortState === 'asc' ? 
            valA.localeCompare(valB) : valB.localeCompare(valA);
    });
    
    currentTable.sortState[headerIndex] = sortState === 'asc' ? 'desc' : 'asc';
    renderTable();
}

// Save data
function saveData() {
    localStorage.setItem('schemas', JSON.stringify(schemas));
}

// Handle cell input
function handleCellInput(tableId, rowIndex, colIndex, value) {
    const schema = schemas.find(s => s.id === currentSchema.id);
    const table = schema.tables.find(t => t.id === tableId);
    table.data[rowIndex][colIndex] = value;
    saveData();
}

// UI rendering
function displaySchemas() {
    const schemaList = document.getElementById('schemaList');
    schemaList.innerHTML = schemas.map(schema => `
        <div class="schema-card">
            <h3 onclick="loadSchema(${schema.id})">${schema.name}</h3>
            <p>Tables: ${schema.tables.length}</p>
            <button onclick="editSchema(${schema.id})">Edit</button>
            <button onclick="deleteSchema(${schema.id})">Delete</button>
        </div>
    `).join('');
}

function loadSchema(schemaId) {
    currentSchema = schemas.find(s => s.id === schemaId);
    document.getElementById('schemaPage').style.display = 'none';
    document.getElementById('tablePage').style.display = 'block';
    document.getElementById('schemaTitle').textContent = currentSchema.name;
    populateTableSelector();
}

function renderTable() {
    const container = document.getElementById('tableContainer');
    container.innerHTML = '';

    if (!currentTable) return;

    const table = document.createElement('table');

    // Create header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    currentTable.headers.forEach((header, index) => {
        const th = document.createElement('th');
        th.textContent = header;
        th.onclick = () => handleHeaderClick(index); // Click to edit or delete header
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create body
    const tbody = document.createElement('tbody');
    currentTable.data.forEach((row, rowIndex) => {
        const tr = document.createElement('tr');
        row.forEach((cell, colIndex) => {
            const td = document.createElement('td');
            const input = document.createElement('input');
            input.value = cell;
            input.oninput = (e) => handleCellInput(currentTable.id, rowIndex, colIndex, e.target.value);
            td.appendChild(input);
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    // Create controls
    const controls = document.getElementById('tableControls');
    controls.innerHTML = `
        <button onclick="addRow()">Add Row</button>
        <button onclick="addHeader()">Add Header</button>
        <button onclick="saveData()">Save</button>
        <button onclick="editTable(${currentTable.id})">Edit Table</button>
        <button onclick="deleteTable(${currentTable.id})">Delete Table</button>
    `;

    container.appendChild(table);
}

function handleHeaderClick(headerIndex) {
    const action = prompt(`Choose an action for "${currentTable.headers[headerIndex]}"\n1. Edit\n2. Delete`);
    
    if (action === "1") {
        editHeader(headerIndex);
    } else if (action === "2") {
        deleteHeader(headerIndex);
    }
}

function editHeader(headerIndex) {
    const newName = prompt('Enter new header name:', currentTable.headers[headerIndex]);
    if (newName) {
        currentTable.headers[headerIndex] = newName;
        saveData();
        renderTable();
    }
}

function deleteHeader(headerIndex) {
    if (!confirm(`Are you sure you want to delete "${currentTable.headers[headerIndex]}"?`)) return;

    currentTable.headers.splice(headerIndex, 1); // Remove header
    currentTable.data.forEach(row => row.splice(headerIndex, 1)); // Remove column data
    saveData();
    renderTable();
}

// Populate table selector
function populateTableSelector() {
    const selector = document.getElementById('tableSelector');
    selector.innerHTML = currentSchema.tables
        .map(table => `<option value="${table.id}">${table.name}</option>`)
        .join('');

    selector.onchange = function () {
        loadTable(parseInt(this.value)); // Load the selected table
    };

    if (currentSchema.tables.length) {
        selector.value = currentSchema.tables[0].id; // Set default selection
        loadTable(currentSchema.tables[0].id); // Load first table
    }
}


function loadTable(tableId) {
    currentTable = currentSchema.tables.find(t => t.id === tableId);
    renderTable();
}

// Initial load
displaySchemas();
