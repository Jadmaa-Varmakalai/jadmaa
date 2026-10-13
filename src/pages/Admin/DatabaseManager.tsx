import React, { useEffect, useState } from 'react';
import { dbApi } from '../../lib/api/dbApi';
import { Database, Trash2 } from 'lucide-react';

export const DatabaseManager: React.FC = () => {
  const [tables, setTables] = useState<string[]>([]);
  const [activeTable, setActiveTable] = useState<string | null>(null);
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (activeTable) {
      fetchTableData(activeTable, 1);
    }
  }, [activeTable]);

  const fetchTables = async () => {
    try {
      const res = await dbApi.getTables();
      if (res.data) {
        setTables(res.data);
        if (res.data.length > 0 && !activeTable) setActiveTable(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTableData = async (table: string, page: number) => {
    setLoading(true);
    try {
      const res = await dbApi.getTableData(table, page, pagination.limit);
      setData(res.data.items);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!activeTable) return;
    if (!window.confirm('Are you sure you want to delete this row? This cannot be undone.')) return;
    
    try {
      await dbApi.deleteTableRow(activeTable, id);
      fetchTableData(activeTable, pagination.page);
    } catch (err) {
      alert('Failed to delete row');
    }
  };

  // Extract columns dynamically from the first item
  const columns = data.length > 0 ? Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object' && !Array.isArray(data[0][k])) : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-heading font-bold flex items-center">
          <Database className="w-5 h-5 mr-2 text-jadmaa-red" />
          Database Explorer
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="col-span-1 bg-white border rounded-xl overflow-hidden shadow-sm h-[calc(100vh-250px)] flex flex-col">
          <div className="p-4 bg-gray-50 border-b font-bold text-sm text-gray-700">Tables</div>
          <div className="overflow-y-auto p-2 space-y-1">
            {tables.map(table => (
              <button
                key={table}
                onClick={() => setActiveTable(table)}
                className={`w-full text-left px-3 py-2 text-sm rounded ${activeTable === table ? 'bg-jadmaa-red/10 text-jadmaa-red font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {table}
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-1 md:col-span-3 bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col h-[calc(100vh-250px)]">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
            <h3 className="font-bold text-gray-800">{activeTable} Data</h3>
            <div className="text-xs text-gray-500">Total Records: {pagination.total}</div>
          </div>
          
          <div className="overflow-auto flex-1 p-0">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading data...</div>
            ) : data.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No records found in this table.</div>
            ) : (
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-white sticky top-0 border-b z-10">
                  <tr>
                    <th className="px-4 py-3 font-bold text-gray-700 w-10">Actions</th>
                    {columns.map(col => (
                      <th key={col} className="px-4 py-3 font-bold text-gray-700">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.map((row, i) => (
                    <tr key={row.id || i} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border-r bg-gray-50">
                        <button onClick={() => handleDelete(row.id)} className="text-red-500 hover:text-red-700" title="Delete Row">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                      {columns.map(col => (
                        <td key={col} className="px-4 py-2 max-w-[200px] truncate text-gray-600">
                          {String(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          <div className="p-3 border-t bg-gray-50 flex justify-between items-center text-xs">
            <div>Page {pagination.page} of {pagination.totalPages || 1}</div>
            <div className="flex space-x-2">
              <button disabled={pagination.page <= 1} onClick={() => fetchTableData(activeTable!, pagination.page - 1)} className="px-2 py-1 border rounded bg-white disabled:opacity-50">Prev</button>
              <button disabled={pagination.page >= pagination.totalPages} onClick={() => fetchTableData(activeTable!, pagination.page + 1)} className="px-2 py-1 border rounded bg-white disabled:opacity-50">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
