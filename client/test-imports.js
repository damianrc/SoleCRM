// Simple test to verify DataTables imports work
console.log('Testing DataTables imports...');

try {
  // Test the imports
  require('datatables.net-bs5/js/dataTables.bootstrap5.min.js');
  console.log('✅ datatables.net-bs5 loaded');
  
  require('datatables.net-colreorder/js/dataTables.colReorder.min.js');
  console.log('✅ dataTables.colReorder loaded');
  
  require('datatables.net-colreorder-bs5/js/colReorder.bootstrap5.min.js');
  console.log('✅ colReorder.bootstrap5 loaded');
  
  require('jquery-resizable-columns/dist/jquery.resizableColumns.js');
  console.log('✅ jquery-resizable-columns loaded');
  
  console.log('🎉 All imports successful!');
} catch (error) {
  console.error('❌ Import error:', error.message);
}
