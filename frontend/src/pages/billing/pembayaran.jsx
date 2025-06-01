import React, { useState } from 'react';
import { Printer, Search, CreditCard, CheckCircle, Clock, AlertCircle, FileText, Calendar, User, DollarSign, Pill, Stethoscope, ChevronRight, ArrowLeft, ArrowRight } from 'lucide-react';

function Pembayaran() {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [filterText, setFilterText] = useState('');

  const invoices = [
    { id: 'INV-1001', date: '03/03/2023', amount: 9276.39, status: 'Overdue', patientName: 'Muhammad Naufal Halim', rmNumber: 'RM-2025040002' },
    { id: 'INV-1002', date: '15/03/2023', amount: 3122.00, status: 'Pending', patientName: 'Siti Nurhaliza', rmNumber: 'RM-2025040003' },
    { id: 'INV-1003', date: '20/03/2023', amount: 5500.00, status: 'Paid', patientName: 'Ahmad Dhani', rmNumber: 'RM-2025040004' },
  ];

  const filteredInvoices = invoices.filter(invoice => 
    invoice.id.toLowerCase().includes(filterText.toLowerCase()) || 
    invoice.date.includes(filterText) || 
    invoice.status.toLowerCase().includes(filterText.toLowerCase()) ||
    invoice.patientName.toLowerCase().includes(filterText.toLowerCase()) ||
    invoice.rmNumber.toLowerCase().includes(filterText.toLowerCase())
  );

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleInvoiceSelect = (invoice) => {
    setSelectedInvoice(invoice);
  };

  const handleSave = () => {
    // Placeholder for save functionality
    alert('Data telah disimpan');
  };

  const handleClose = () => {
    // Placeholder for close functionality
    alert('Menutup form pembayaran');
    setSelectedInvoice(null);
  };

  const handlePrint = () => {
    // Placeholder for print functionality
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      {/* Header Section */}
      <div className="mb-6 bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <CreditCard className="mr-2" />
              Pembayaran
            </h1>
            <p className="text-blue-100 mt-1">Manajemen invoice dan pembayaran pasien</p>
          </div>
          <div className="flex space-x-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-xs text-blue-100">Total Invoice</div>
              <div className="text-xl font-bold">{invoices.length}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-xs text-blue-100">Pending</div>
              <div className="text-xl font-bold">{invoices.filter(inv => inv.status === 'Pending').length}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-xs text-blue-100">Overdue</div>
              <div className="text-xl font-bold">{invoices.filter(inv => inv.status === 'Overdue').length}</div>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="mt-6 flex space-x-3">
          <button 
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${activeTab === 'pending' ? 'bg-white text-blue-700 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'}`} 
            onClick={() => handleTabChange('pending')}
          >
            <Clock size={16} className="mr-2" />
            Pending
          </button>
          <button 
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${activeTab === 'paid' ? 'bg-white text-blue-700 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'}`} 
            onClick={() => handleTabChange('paid')}
          >
            <CheckCircle size={16} className="mr-2" />
            Paid
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* LEFT SIDE: Table */}
        <div className="md:col-span-3 bg-white rounded-xl p-5 shadow-md">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <FileText size={18} className="mr-2 text-blue-600" />
              Daftar Invoice
            </h2>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Cari invoice..." 
                value={filterText} 
                onChange={(e) => setFilterText(e.target.value)} 
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 shadow-sm w-64"
              />
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            </div>
          </div>
          
          <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
            <table className="min-w-full bg-white text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-5 py-3 text-gray-600 font-medium">Invoice ID</th>
                  <th className="px-5 py-3 text-gray-600 font-medium">Pasien / No. RM</th>
                  <th className="px-5 py-3 text-gray-600 font-medium">Tanggal</th>
                  <th className="px-5 py-3 text-gray-600 font-medium">Jumlah</th>
                  <th className="px-5 py-3 text-gray-600 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInvoices
                  .filter(invoice => activeTab === 'pending' ? invoice.status !== 'Paid' : invoice.status === 'Paid')
                  .map((invoice) => (
                    <tr 
                      key={invoice.id} 
                      className={`hover:bg-blue-50 transition-colors duration-150 cursor-pointer ${selectedInvoice?.id === invoice.id ? 'bg-blue-50' : ''}`}
                      onClick={() => handleInvoiceSelect(invoice)}
                    >
                      <td className="px-5 py-4 font-medium text-blue-700">{invoice.id}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-medium shadow-sm mr-3">
                            {invoice.patientName.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-800">{invoice.patientName}</span>
                            <span className="text-xs text-gray-500">{invoice.rmNumber}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-1.5 text-gray-400" />
                          {invoice.date}
                        </div>
                      </td>
                      <td className={`px-5 py-4 font-medium ${invoice.status === 'Overdue' ? 'text-red-600' : 'text-gray-800'}`}>
                        <div className="flex items-center">
                          <DollarSign size={14} className="mr-1 text-gray-400" />
                          Rp. {invoice.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {invoice.status === 'Overdue' ? (
                          <div className="flex items-center px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-medium w-fit">
                            <AlertCircle size={12} className="mr-1" />
                            {invoice.status}
                          </div>
                        ) : invoice.status === 'Pending' ? (
                          <div className="flex items-center px-3 py-1 rounded-full bg-yellow-50 text-yellow-600 text-xs font-medium w-fit">
                            <Clock size={12} className="mr-1" />
                            {invoice.status}
                          </div>
                        ) : (
                          <div className="flex items-center px-3 py-1 rounded-full bg-green-50 text-green-600 text-xs font-medium w-fit">
                            <CheckCircle size={12} className="mr-1" />
                            {invoice.status}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            
            {filteredInvoices
              .filter(invoice => activeTab === 'pending' ? invoice.status !== 'Paid' : invoice.status === 'Paid')
              .length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText size={40} className="mx-auto mb-2 text-gray-300" />
                <p>Tidak ada invoice {activeTab === 'pending' ? 'pending' : 'paid'}</p>
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
            <div>
              Menampilkan {filteredInvoices.filter(invoice => activeTab === 'pending' ? invoice.status !== 'Paid' : invoice.status === 'Paid').length} invoice
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-150">
                <ArrowLeft size={16} />
              </button>
              <button className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-150">
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Invoice Detail */}
        <div className="col-span-2">
          {selectedInvoice ? (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {/* Invoice Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-5 text-white">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold flex items-center">
                    <FileText size={18} className="mr-2" />
                    Detail Invoice
                  </h2>
                  <button 
                    className="flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm" 
                    onClick={handlePrint}
                  >
                    <Printer size={16} />
                    Print Invoice
                  </button>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 text-sm inline-flex items-center">
                      <User size={14} className="mr-1.5" />
                      {selectedInvoice.rmNumber}
                    </div>
                    <h3 className="font-bold text-2xl mt-2">{selectedInvoice.patientName}</h3>
                    <div className="flex items-center mt-1 text-blue-100">
                      <Calendar size={14} className="mr-1.5" />
                      {selectedInvoice.date}
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div className="text-blue-100 text-sm mb-1">Total Pembayaran</div>
                    <div className="text-2xl font-bold">Rp. {selectedInvoice.amount.toLocaleString()},-</div>
                    <div className="mt-2">
                      {selectedInvoice.status === 'Overdue' ? (
                        <div className="flex items-center justify-center px-3 py-1 rounded-full bg-red-500/20 text-white text-xs font-medium">
                          <AlertCircle size={12} className="mr-1" />
                          {selectedInvoice.status}
                        </div>
                      ) : selectedInvoice.status === 'Pending' ? (
                        <div className="flex items-center justify-center px-3 py-1 rounded-full bg-yellow-500/20 text-white text-xs font-medium">
                          <Clock size={12} className="mr-1" />
                          {selectedInvoice.status}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center px-3 py-1 rounded-full bg-green-500/20 text-white text-xs font-medium">
                          <CheckCircle size={12} className="mr-1" />
                          {selectedInvoice.status}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice Content */}
              <div className="p-5">
                {/* Pelayanan Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800 flex items-center">
                      <Stethoscope size={16} className="mr-2 text-blue-600" />
                      Pelayanan
                    </h3>
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                      2 items
                    </div>
                  </div>
                  
                  <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deskripsi</th>
                          <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Harga</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 text-sm">
                        <tr className="hover:bg-gray-50">
                          <td className="px-5 py-3 font-medium text-gray-900">A01.1</td>
                          <td className="px-5 py-3 text-gray-700">Cabut Gigi Depan</td>
                          <td className="px-5 py-3 text-right font-medium text-gray-900">Rp. 200.000,-</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-5 py-3 font-medium text-gray-900">A01.2</td>
                          <td className="px-5 py-3 text-gray-700">Cabut Gigi Belakang</td>
                          <td className="px-5 py-3 text-right font-medium text-gray-900">Rp. 200.000,-</td>
                        </tr>
                      </tbody>
                      <tfoot className="bg-blue-50">
                        <tr>
                          <td colSpan="2" className="px-5 py-3 text-right text-xs font-medium text-blue-700 uppercase">Subtotal</td>
                          <td className="px-5 py-3 text-right font-semibold text-blue-700">Rp. 400.000,-</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Obat Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800 flex items-center">
                      <Pill size={16} className="mr-2 text-blue-600" />
                      Obat
                    </h3>
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                      2 items
                    </div>
                  </div>
                  
                  <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                          <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                          <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Harga</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 text-sm">
                        <tr className="hover:bg-gray-50">
                          <td className="px-5 py-3 font-medium text-gray-900">Paracetamol Tablet</td>
                          <td className="px-5 py-3 text-gray-700">100 Tablet</td>
                          <td className="px-5 py-3 text-right font-medium text-gray-900">Rp. 150.000,-</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-5 py-3 font-medium text-gray-900">Amoxivilin Botol</td>
                          <td className="px-5 py-3 text-gray-700">1 Botol</td>
                          <td className="px-5 py-3 text-right font-medium text-gray-900">Rp. 150.000,-</td>
                        </tr>
                      </tbody>
                      <tfoot className="bg-green-50">
                        <tr>
                          <td colSpan="2" className="px-5 py-3 text-right text-xs font-medium text-green-700 uppercase">Subtotal</td>
                          <td className="px-5 py-3 text-right font-semibold text-green-700">Rp. 300.000,-</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Summary Section */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Subtotal Pelayanan</span>
                    <span className="font-medium">Rp. 400.000,-</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Subtotal Obat</span>
                    <span className="font-medium">Rp. 300.000,-</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                    <span className="font-semibold text-gray-800">Total</span>
                    <span className="font-bold text-blue-700">Rp. 700.000,-</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button 
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center" 
                    onClick={handleSave}
                  >
                    <CheckCircle size={18} className="mr-2" />
                    Simpan Pembayaran
                  </button>
                  <button 
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors duration-200" 
                    onClick={handleClose}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <FileText size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">Tidak Ada Invoice Dipilih</h3>
              <p className="text-gray-500 mb-6">Pilih invoice dari daftar untuk melihat detail pembayaran</p>
              <div className="bg-blue-50 text-blue-700 p-3 rounded-lg inline-flex items-center text-sm">
                <ChevronRight size={16} className="mr-1" />
                Klik pada baris invoice di sebelah kiri
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Pembayaran;