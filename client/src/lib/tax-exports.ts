// Tax Report Export Utilities

export function downloadCSV(data: string, filename: string) {
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportTradesToCSV(trades: any[], year: number) {
  const headers = [
    'Date',
    'Instrument',
    'Type',
    'Position Size',
    'Entry Price',
    'Exit Price',
    'P&L',
    'Swap',
    'Commission',
    'Currency',
    'P&L (Report)',
    'Swap (Report)',
    'Commission (Report)',
    'Status'
  ];

  const rows = trades
    .filter(trade => trade.exit_date && new Date(trade.exit_date).getFullYear() === year)
    .map(trade => [
      new Date(trade.exit_date).toLocaleDateString(),
      trade.instrument,
      trade.trade_type,
      trade.position_size,
      trade.entry_price,
      trade.exit_price || '',
      trade.pnl || '0',
      trade.swap || '0',
      trade.commission || '0',
      trade.currency || 'USD',
      trade.pnl_report || trade.pnl || '0',
      trade.swap_report || trade.swap || '0',
      trade.commission_report || trade.commission || '0',
      trade.status
    ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  downloadCSV(csv, `trades_${year}.csv`);
}

export function exportExpensesToCSV(expenses: any[], year: number) {
  const headers = [
    'Date',
    'Type',
    'Vendor',
    'Amount',
    'Currency',
    'Amount (Report)',
    'Notes'
  ];

  const rows = expenses.map(expense => [
    new Date(expense.expense_date).toLocaleDateString(),
    expense.expense_type,
    expense.vendor,
    expense.amount,
    expense.currency || 'USD',
    expense.amount_report || expense.amount,
    expense.notes || ''
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  downloadCSV(csv, `expenses_${year}.csv`);
}

export function exportTaxSummaryHTML(summary: any, year: number) {
  const monthNames = ["January", "February", "March", "April", "May", "June", 
                      "July", "August", "September", "October", "November", "December"];
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tax Summary ${year}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1 { color: #2563eb; }
    h2 { color: #475569; margin-top: 30px; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    th {
      background-color: #f1f5f9;
      font-weight: 600;
    }
    .positive { color: #16a34a; }
    .negative { color: #dc2626; }
    .summary-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .metric {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 15px;
    }
    .metric-label {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 5px;
    }
    .metric-value {
      font-size: 24px;
      font-weight: 700;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      color: #64748b;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <h1>Tax Summary Report - ${year}</h1>
  <p>Generated on ${new Date().toLocaleDateString()}</p>

  <div class="summary-grid">
    <div class="metric">
      <div class="metric-label">Trading Income</div>
      <div class="metric-value ${summary.totals.trading_income >= 0 ? 'positive' : 'negative'}">
        $${summary.totals.trading_income.toFixed(2)}
      </div>
    </div>
    <div class="metric">
      <div class="metric-label">Swap Income</div>
      <div class="metric-value positive">
        $${summary.totals.swap_income.toFixed(2)}
      </div>
    </div>
    <div class="metric">
      <div class="metric-label">Total Deductions</div>
      <div class="metric-value negative">
        $${(summary.totals.commission_deduction + summary.totals.expenses).toFixed(2)}
      </div>
    </div>
    <div class="metric">
      <div class="metric-label">Net Taxable Income</div>
      <div class="metric-value ${summary.totals.net_income >= 0 ? 'positive' : 'negative'}">
        $${summary.totals.net_income.toFixed(2)}
      </div>
    </div>
  </div>

  <div class="summary-card">
    <h3>Tax Settings Applied</h3>
    <ul>
      <li>Reporting Currency: ${summary.tax_profile.reporting_currency}</li>
      <li>Include Swap in Income: ${summary.tax_profile.include_swap_in_income ? 'Yes' : 'No'}</li>
      <li>Include Commission Deduction: ${summary.tax_profile.include_commission_deduction ? 'Yes' : 'No'}</li>
      <li>Include Unrealized P&L: ${summary.tax_profile.include_unrealized_pnl ? 'Yes' : 'No'}</li>
    </ul>
  </div>

  <h2>Monthly Breakdown</h2>
  <table>
    <thead>
      <tr>
        <th>Month</th>
        <th>Trading Income</th>
        <th>Swap Income</th>
        <th>Commission</th>
        <th>Expenses</th>
        <th>Net Income</th>
      </tr>
    </thead>
    <tbody>
      ${summary.monthly
        .filter((m: any) => m.trading_income !== 0 || m.expenses !== 0)
        .map((month: any) => `
        <tr>
          <td>${monthNames[month.month - 1]}</td>
          <td class="${month.trading_income >= 0 ? 'positive' : 'negative'}">
            $${month.trading_income.toFixed(2)}
          </td>
          <td>$${month.swap_income.toFixed(2)}</td>
          <td>$${month.commission_deduction.toFixed(2)}</td>
          <td>$${month.expenses.toFixed(2)}</td>
          <td class="${month.net_income >= 0 ? 'positive' : 'negative'}">
            <strong>$${month.net_income.toFixed(2)}</strong>
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p><strong>Disclaimer:</strong> This report is for informational purposes only and should not be considered tax advice. 
    Please consult with a qualified tax professional or CPA for accurate tax filing guidance.</p>
    <p>Generated by TJ - Traders Brotherhood | ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
  `;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `tax_summary_${year}.html`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportTaxSummaryPDF(summary: any, year: number) {
  // For a proper PDF, we'd use a library like jsPDF or pdfmake
  // For now, we'll create a simplified version using the browser's print functionality
  const monthNames = ["January", "February", "March", "April", "May", "June", 
                      "July", "August", "September", "October", "November", "December"];
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to download PDF');
    return;
  }

  printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>Tax Summary ${year}</title>
  <style>
    @media print {
      @page { margin: 1in; }
    }
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    h1 { color: #2563eb; font-size: 24px; }
    h2 { color: #475569; font-size: 18px; margin-top: 20px; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th, td {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th { background-color: #f8f9fa; }
    .positive { color: #16a34a; }
    .negative { color: #dc2626; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    .metric {
      border: 1px solid #ddd;
      padding: 10px;
    }
    .metric-label {
      font-size: 12px;
      color: #666;
    }
    .metric-value {
      font-size: 20px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <h1>Tax Summary Report - ${year}</h1>
  <p>Generated on ${new Date().toLocaleDateString()}</p>

  <div class="summary-grid">
    <div class="metric">
      <div class="metric-label">Trading Income</div>
      <div class="metric-value ${summary.totals.trading_income >= 0 ? 'positive' : 'negative'}">
        $${summary.totals.trading_income.toFixed(2)}
      </div>
    </div>
    <div class="metric">
      <div class="metric-label">Swap Income</div>
      <div class="metric-value">$${summary.totals.swap_income.toFixed(2)}</div>
    </div>
    <div class="metric">
      <div class="metric-label">Total Deductions</div>
      <div class="metric-value">
        $${(summary.totals.commission_deduction + summary.totals.expenses).toFixed(2)}
      </div>
    </div>
    <div class="metric">
      <div class="metric-label">Net Taxable Income</div>
      <div class="metric-value ${summary.totals.net_income >= 0 ? 'positive' : 'negative'}">
        $${summary.totals.net_income.toFixed(2)}
      </div>
    </div>
  </div>

  <h2>Monthly Breakdown</h2>
  <table>
    <thead>
      <tr>
        <th>Month</th>
        <th>Trading Income</th>
        <th>Swap</th>
        <th>Commission</th>
        <th>Expenses</th>
        <th>Net</th>
      </tr>
    </thead>
    <tbody>
      ${summary.monthly
        .filter((m: any) => m.trading_income !== 0 || m.expenses !== 0)
        .map((month: any) => `
        <tr>
          <td>${monthNames[month.month - 1]}</td>
          <td>$${month.trading_income.toFixed(2)}</td>
          <td>$${month.swap_income.toFixed(2)}</td>
          <td>$${month.commission_deduction.toFixed(2)}</td>
          <td>$${month.expenses.toFixed(2)}</td>
          <td><strong>$${month.net_income.toFixed(2)}</strong></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <p style="margin-top: 30px; font-size: 11px; color: #666;">
    <strong>Disclaimer:</strong> This report is for informational purposes only. 
    Please consult with a qualified tax professional for accurate tax filing.
  </p>
</body>
</html>
  `);
  
  printWindow.document.close();
  printWindow.focus();
  
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}
