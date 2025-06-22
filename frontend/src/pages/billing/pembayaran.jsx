import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config';
import { 
  Printer, 
  Search, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  Calendar, 
  User, 
  DollarSign, 
  Pill, 
  Stethoscope, 
  ChevronRight, 
  ArrowLeft, 
  ArrowRight,
  Package,
  PackageCheck,
  PackageX,
  Users,
  Loader2,
  XCircle,
  RefreshCw,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  Save,
  AlertTriangle,
  Receipt,
  Wallet,
  Banknote,
  CreditCard as CreditCardIcon,
  Calculator,
  Minus,
  Percent,
  Shield,
  Zap,
  Info,
  Lock,
  Unlock,
  RotateCcw,
  Archive,
  ArchiveX
} from 'lucide-react';

// CSS for animations
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  
  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  
  .animate-fade-in {
    animation: fadeIn 0.5s ease-out forwards;
  }
  
  .animate-slide-in-right {
    animation: slideInRight 0.3s ease-out forwards;
  }
  
  .animate-slide-in-left {
    animation: slideInLeft 0.3s ease-out forwards;
  }
  
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 10px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #94a3b8;
    border-radius: 10px;
    transition: all 0.3s ease;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #64748b;
  }
`;

const formatRupiah = (value, withRp = true) => {
    if (!value && value !== 0) return '';
    const number = Number(parseRupiah(value.toString()));
    if (isNaN(number)) return '';
    const formatted = number.toLocaleString('id-ID');
    return withRp ? `Rp ${formatted}` : formatted;
};

const parseRupiah = (value) => {
    if (typeof value !== 'string') return '';
    return value.replace(/[^0-9]/g, '');
};

const getInvoiceStatusInfo = (invoice) => {
    if (!invoice) return {};
    const paid = Number(invoice.paid_amount) || 0;
    const total = Number(invoice.total);

    if (invoice.appointment_status === 'completed') {
        return { 
            text: 'Closed', 
            icon: <Archive size={12} className="mr-1.5"/>,
            cardStyle: 'bg-gradient-to-r from-gray-200/50 to-gray-300/30',
            badgeStyle: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border border-gray-600'
        };
    }

    if (total === 0) {
      return { 
        text: 'Empty', 
        icon: <PackageX size={12} className="mr-1.5"/>,
        cardStyle: 'bg-gradient-to-r from-gray-50/50 to-gray-100/30',
        badgeStyle: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-200'
      };
    }

    if (total > 0 && paid >= total) {
      return { 
        text: 'Lunas', 
        icon: <CheckCircle size={12} className="mr-1.5"/>,
        cardStyle: 'bg-gradient-to-r from-green-50/50 to-emerald-50/30',
        badgeStyle: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200'
      };
    }
    if (paid > 0) {
      return { 
        text: 'Dibayar Sebagian', 
        icon: <Minus size={12} className="mr-1.5"/>,
        cardStyle: 'bg-gradient-to-r from-blue-50/50 to-indigo-50/30',
        badgeStyle: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200'
      };
    }
    return { 
      text: 'Belum Lunas', 
      icon: <Clock size={12} className="mr-1.5"/>,
      cardStyle: 'bg-gradient-to-r from-amber-50/50 to-orange-50/30',
      badgeStyle: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-200'
    };
};

const getSortOrder = (invoice) => {
    const paid = Number(invoice.paid_amount) || 0;
    const total = Number(invoice.total);

    if (total > 0 && paid < total) {
        return 1; // 1. Belum Lunas / Dibayar Sebagian
    }
    if (total === 0) {
        return 2; // 2. Empty
    }
    return 3; // 3. Lunas (but active)
};

function Pembayaran() {
  const [activeTab, setActiveTab] = useState('active');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    method: 'cash',
    reference: '',
    notes: ''
  });
  const [processingPayment, setProcessingPayment] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showDetail, setShowDetail] = useState(false); // State untuk kontrol tampilan di tablet
  const [isTransitioning, setIsTransitioning] = useState(false); // State untuk loading transisi

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${config.apiUrl}/billing/payments`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data.success) {
          setInvoices(res.data.data);
        } else {
          setError(res.data.message || 'Gagal memuat data pembayaran');
        }
      } catch {
        setError('Gagal memuat data pembayaran');
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedInvoice(null);
  };

  const handleInvoiceSelect = (invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentForm(false);
    setShowDetail(true); // Tampilkan detail di tablet
    // Set default payment amount to remaining balance
    const remaining = Number(invoice.total) - (Number(invoice.paid_amount) || 0);
    setPaymentData({
      amount: remaining > 0 ? remaining.toString() : '',
      method: 'cash',
      reference: '',
      notes: ''
    });
  };

  const handleSave = () => {
    setSuccess('Pembayaran berhasil disimpan!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleClose = () => {
    setSelectedInvoice(null);
    setShowPaymentForm(false);
    setShowDetail(false); // Sembunyikan detail di tablet
  };

  const handleBackToList = () => {
    setShowDetail(false); // Sembunyikan detail di tablet
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePaymentSubmit = async () => {
    const tenderedAmount = Number(parseRupiah(paymentData.amount)) || 0;

    if (!selectedInvoice || tenderedAmount <= 0) {
      setError('Mohon isi jumlah pembayaran yang valid.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const remainingBalance = getRemainingBalance(selectedInvoice);
    const amountToPay = Math.min(tenderedAmount, remainingBalance);

    if (amountToPay <= 0 && remainingBalance > 0) {
        setError('Jumlah pembayaran harus lebih besar dari nol.');
        setTimeout(() => setError(''), 3000);
        return;
    }

    setProcessingPayment(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${config.apiUrl}/billing/payments/pay`, {
        paymentId: selectedInvoice.payment_id,
        amount: amountToPay.toString(),
        method: paymentData.method,
        notes: paymentData.notes,
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      if (response.data.success) {
        const change = tenderedAmount > remainingBalance ? tenderedAmount - remainingBalance : 0;
        if (change > 0) {
            setSuccess(`Pembayaran lunas! Kembalian: ${formatRupiah(change)}`);
        } else {
            setSuccess('Pembayaran berhasil diproses!');
        }
        
        setShowPaymentForm(false);
        
        const updatedInvoice = response.data.data;
        
        // Update local state
        setSelectedInvoice(updatedInvoice);
        setInvoices(prevInvoices => 
            prevInvoices.map(inv => 
                inv.payment_id === updatedInvoice.payment_id ? updatedInvoice : inv
            )
        );
        
        // Reset payment form
        setPaymentData({ amount: '', method: 'cash', reference: '', notes: '' });
        
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(response.data.message || 'Gagal memproses pembayaran');
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan saat memproses pembayaran');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleInvoiceAction = async (actionType) => {
    if (!selectedInvoice) return;
    
    setIsProcessingAction(true);
    setError('');
    setSuccess('');

    const { payment_id } = selectedInvoice;
    let endpoint = `${config.apiUrl}/billing/payments/${payment_id}/${actionType}`;
    let successMessage = '';
    
    switch(actionType) {
        case 'close':
            successMessage = 'Invoice berhasil ditutup.';
            break;
        case 'activate':
            successMessage = 'Invoice berhasil diaktifkan kembali.';
            break;
        case 'reset':
            successMessage = 'Pembayaran berhasil direset.';
            setShowConfirmReset(false);
            break;
        default:
            break;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(endpoint, {}, { headers: { Authorization: `Bearer ${token}` } });
      
      if (response.data.success) {
        setSuccess(successMessage);
        const updatedInvoice = response.data.data;
        
        setSelectedInvoice(updatedInvoice);
        setInvoices(prevInvoices => 
            prevInvoices.map(inv => 
                inv.payment_id === updatedInvoice.payment_id ? updatedInvoice : inv
            )
        );
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.data.message || `Gagal ${actionType} invoice.`);
      }
    } catch (err) {
      setError(err.response?.data?.message || `Terjadi kesalahan saat ${actionType} invoice.`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const getFilteredInvoices = () => {
    // 1. Filter by tab (Active/Closed)
    let tabFiltered = [];
    if (activeTab === 'active') {
      tabFiltered = invoices.filter(inv => inv.appointment_status !== 'completed');
    } else { // 'closed'
      tabFiltered = invoices.filter(inv => inv.appointment_status === 'completed');
    }

    // 2. Filter by search text
    const searchFiltered = tabFiltered.filter(invoice => 
        (invoice.payment_id?.toLowerCase().includes(filterText.toLowerCase()) || '') ||
        (invoice.visit_id?.toString().includes(filterText) || '') ||
        (invoice.nama_lengkap?.toLowerCase().includes(filterText.toLowerCase()) || '') ||
        (invoice.payment_date?.toLowerCase().includes(filterText.toLowerCase()) || '')
    );

    // 3. Custom sort
    searchFiltered.sort((a, b) => {
        if (activeTab === 'active') {
            const orderA = getSortOrder(a);
            const orderB = getSortOrder(b);
            if (orderA !== orderB) {
                return orderA - orderB;
            }
        } else { // 'closed'
            return new Date(b.status_updated_at) - new Date(a.status_updated_at);
        }
        return b.payment_id.localeCompare(a.payment_id);
    });

    return searchFiltered;
  };

  const invoiceStats = {
    active: invoices.filter(inv => inv.appointment_status !== 'completed').length,
    closed: invoices.filter(inv => inv.appointment_status === 'completed').length
  };

  const getRemainingBalance = (invoice) => {
    return Number(invoice.total) - (Number(invoice.paid_amount) || 0);
  };

  const isFullyPaid = (invoice) => {
    return getRemainingBalance(invoice) <= 0;
  };

  const getPaymentPercentage = (invoice) => {
    const paid = Number(invoice.paid_amount) || 0;
    const total = Number(invoice.total);
    return total > 0 ? Math.round((paid / total) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 p-6">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      {/* Header Section */}
      <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6 backdrop-blur-sm border border-blue-100/50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-3 sm:mr-4 shadow-lg">
                <CreditCard className="text-white" size={20} />
              </div>
              Pembayaran
            </h1>
            <p className="mt-1 sm:mt-2 text-gray-600 font-medium text-sm sm:text-base">Kelola dan monitor pembayaran pasien dengan sistem yang terintegrasi.</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center">
                <Users size={14} className="text-white sm:w-4 sm:h-4" />
              </div>
              <div>
                <span className="font-bold text-gray-800 text-base sm:text-lg">{invoiceStats.active + invoiceStats.closed}</span>
                <span className="text-gray-600 text-xs sm:text-sm block">Total</span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <ArchiveX size={14} className="text-white sm:w-4 sm:h-4" />
              </div>
              <div>
                <span className="font-bold text-blue-800 text-base sm:text-lg">{invoiceStats.active}</span>
                <span className="text-blue-700 text-xs sm:text-sm block">Aktif</span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center">
                <Archive size={14} className="text-white sm:w-4 sm:h-4" />
              </div>
              <div>
                <span className="font-bold text-gray-800 text-base sm:text-lg">{invoiceStats.closed}</span>
                <span className="text-gray-700 text-xs sm:text-sm block">Ditutup</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-3">
          <button 
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center shadow-lg hover:shadow-xl hover:scale-105 transform ${
              activeTab === 'active' 
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-xl' 
                : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white border border-gray-200'
            }`}
            onClick={() => handleTabChange('active')}
          >
            <ArchiveX size={14} className="mr-1.5 sm:mr-2" />
            Aktif ({invoiceStats.active})
          </button>
          <button 
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center shadow-lg hover:shadow-xl hover:scale-105 transform ${
              activeTab === 'closed' 
                ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-xl' 
                : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white border border-gray-200'
            }`} 
            onClick={() => handleTabChange('closed')}
          >
            <Archive size={14} className="mr-1.5 sm:mr-2" />
            Ditutup ({invoiceStats.closed})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6">
        {/* LEFT SIDE: Invoice List (30%) */}
        <div className={`xl:col-span-4 transition-all duration-300 ease-in-out ${showDetail ? 'hidden xl:block' : 'block animate-slide-in-left'}`}>
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-2 sm:mr-3 shadow-lg">
                  <FileText size={16} className="text-white sm:w-5 sm:h-5" />
                </div>
              Daftar Invoice
            </h2>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4 pointer-events-none">
                  <Search className="text-gray-500" size={16} />
                </div>
              <input 
                type="text" 
                placeholder="Cari invoice..." 
                value={filterText} 
                onChange={(e) => setFilterText(e.target.value)} 
                  className="pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 hover:border-blue-400 text-sm font-medium bg-white/80 backdrop-blur-sm shadow-sm w-full sm:w-64"
              />
              </div>
            </div>
            
            <div className="space-y-2 sm:space-y-3 max-h-[65vh] sm:max-h-[70vh] overflow-y-auto custom-scrollbar p-1">
              {loading ? (
                <div className="text-center py-8 sm:py-12 text-gray-500 flex flex-col items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-3 shadow-lg">
                    <Loader2 size={20} className="text-white animate-spin sm:w-6 sm:h-6" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium">Memuat data pembayaran...</span>
                </div>
              ) : error ? (
                <div className="text-center py-8 sm:py-12 text-red-500 flex flex-col items-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center mb-4 shadow-lg">
                    <AlertTriangle size={24} className="text-red-500 sm:w-8 sm:h-8" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-red-600">{error}</span>
                </div>
              ) : getFilteredInvoices().length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-gray-500 flex flex-col items-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4 shadow-lg">
                    <PackageX size={24} className="text-gray-400 sm:w-8 sm:h-8" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-600">Tidak ada invoice</span>
                  <span className="text-xs text-gray-500">Tidak ada invoice yang sesuai dengan filter ini.</span>
                </div>
              ) : (
                getFilteredInvoices().map((invoice) => {
                  const isSelected = selectedInvoice?.payment_id === invoice.payment_id;
                  const remainingBalance = getRemainingBalance(invoice);
                  const paymentPercentage = getPaymentPercentage(invoice);
                  const statusInfo = getInvoiceStatusInfo(invoice);
                  
                  return (
                    <div
                      key={invoice.payment_id}
                      className={`group p-3 sm:p-4 border-l-4 cursor-pointer transition-all duration-300 backdrop-blur-sm rounded-lg ${
                        isSelected
                          ? "border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg scale-[1.02]"
                          : `border-transparent ${statusInfo.cardStyle} hover:bg-gray-100 hover:scale-[1.01] shadow-sm`
                      }`}
                      onClick={() => handleInvoiceSelect(invoice)}
                    >
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-gray-900 text-xs sm:text-sm truncate">
                            {invoice.payment_id}
                          </h3>
                          <div
                            className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-bold shadow-sm flex items-center ${statusInfo.badgeStyle}`}
                          >
                            {statusInfo.icon}
                            {statusInfo.text}
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-600 font-medium truncate">
                          {invoice.nama_lengkap || 'Nama tidak tersedia'}
                        </p>
                        
                        <div className="space-y-1.5 sm:space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500">Total:</span>
                            <span className="font-bold text-gray-900">Rp {Number(invoice.total).toLocaleString('id-ID')}</span>
                          </div>
                          
                          {invoice.paid_amount && (
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-500">Dibayar:</span>
                              <span className="font-medium text-green-600">Rp {Number(invoice.paid_amount).toLocaleString('id-ID')}</span>
                            </div>
                          )}
                          
                          {remainingBalance > 0 && (
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-500">Sisa:</span>
                              <span className="font-bold text-red-600">Rp {remainingBalance.toLocaleString('id-ID')}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Payment Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500">Progress</span>
                            <span className="font-bold text-blue-600">{paymentPercentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                            <div 
                              className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                                paymentPercentage === 100 
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                  : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                              }`}
                              style={{ width: `${paymentPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-gray-500">
                          <span className="flex items-center">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-1 sm:mr-1.5"></div>
                            V:{invoice.visit_id}
                          </span>
                          {invoice.appointment_code && (
                            <span className="flex items-center">
                              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center mr-1 sm:mr-1.5"></div>
                              A:{invoice.appointment_code}
                            </span>
                          )}
                        </div>
                        
                        {/* Indikator klik untuk tablet */}
                        <div className="xl:hidden flex items-center justify-center pt-1">
                          <div className="flex items-center gap-1 text-blue-600 text-xs font-medium">
                            <ArrowRight size={12} />
                            Klik untuk detail
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="flex justify-between items-center mt-4 sm:mt-6 text-xs sm:text-sm text-gray-600">
              <div className="font-medium">
                {getFilteredInvoices().length} dari {invoices.length} invoice
              </div>
            </div>
            
            {/* Tombol kembali ke daftar untuk tablet */}
            {showDetail && (
              <div className="mt-4 xl:hidden">
                <button
                  onClick={handleBackToList}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <ArrowLeft size={16} />
                  Kembali ke Daftar Invoice
                </button>
              </div>
            )}
            
            {/* Indikator untuk tablet ketika tidak ada detail yang dipilih
            {!showDetail && selectedInvoice && (
              <div className="mt-4 xl:hidden animate-fade-in">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-blue-700 text-sm font-medium">
                    <Eye size={16} />
                    Invoice dipilih: {selectedInvoice.payment_id}
                  </div>
                  <button
                    onClick={() => setShowDetail(true)}
                    className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 transform"
                  >
                    <ArrowRight size={16} />
                    Lihat Detail
                  </button>
                </div>
              </div>
            )} */}
          </div>
        </div>

        {/* RIGHT SIDE: Invoice Detail (70%) */}
        <div className={`xl:col-span-8 transition-all duration-300 ease-in-out ${showDetail ? 'block animate-slide-in-right' : 'hidden xl:block'}`}>
          {selectedInvoice ? (
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Invoice Header */}
              <div className="bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 p-4 sm:p-6 text-white">
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                  <div className="flex items-center gap-3">
                    {/* Back button untuk tablet */}
                    <button 
                      onClick={handleBackToList}
                      className="xl:hidden flex items-center gap-1.5 sm:gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform"
                    >
                      <ArrowLeft size={14} className="sm:w-4 sm:h-4" />
                      Kembali
                    </button>
                    <h2 className="text-lg sm:text-xl font-bold flex items-center">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-2 sm:mr-3 shadow-lg">
                        <FileText size={16} className="text-white sm:w-5 sm:h-5" />
                      </div>
                      Detail Invoice
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    {(() => {
                      const isClosed = selectedInvoice.appointment_status === 'completed';
                      const isPaid = isFullyPaid(selectedInvoice);
                      const hasPayment = Number(selectedInvoice.paid_amount) > 0;

                      return (
                        <>
                          {isPaid && isClosed && (
                            <button 
                              className="flex items-center gap-1.5 sm:gap-2 bg-yellow-500/80 backdrop-blur-sm hover:bg-yellow-600/90 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform"
                              onClick={() => handleInvoiceAction('activate')}
                              disabled={isProcessingAction}
                            >
                              {isProcessingAction ? <Loader2 size={14} className="animate-spin sm:w-4 sm:h-4"/> : <Unlock size={14} className="sm:w-4 sm:h-4" />}
                              {isProcessingAction ? 'Mengaktifkan...' : 'Activate'}
                            </button>
                          )}
                          {isPaid && !isClosed && (
                            <button 
                              className="flex items-center gap-1.5 sm:gap-2 bg-blue-500/80 backdrop-blur-sm hover:bg-blue-600/90 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform"
                              onClick={() => handleInvoiceAction('close')}
                              disabled={isProcessingAction}
                            >
                              {isProcessingAction ? <Loader2 size={14} className="animate-spin sm:w-4 sm:h-4"/> : <Lock size={14} className="sm:w-4 sm:h-4" />}
                              {isProcessingAction ? 'Menutup...' : 'Close'}
                            </button>
                          )}
                          {hasPayment && !isClosed && (
                             <button 
                                className="flex items-center gap-1.5 sm:gap-2 bg-red-500/80 backdrop-blur-sm hover:bg-red-600/90 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform"
                                onClick={() => setShowConfirmReset(true)}
                                disabled={isProcessingAction}
                              >
                                {isProcessingAction ? <Loader2 size={14} className="animate-spin sm:w-4 sm:h-4"/> : <RotateCcw size={14} className="sm:w-4 sm:h-4" />}
                                Reset
                              </button>
                          )}
                        </>
                      )
                    })()}
                    <button 
                      className="flex items-center gap-1.5 sm:gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform" 
                      onClick={handlePrint}
                    >
                      <Printer size={14} className="sm:w-4 sm:h-4" />
                      Print
                    </button>
                    <button 
                      className="flex items-center gap-1.5 sm:gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform" 
                      onClick={handleClose}
                    >
                      <XCircle size={14} className="sm:w-4 sm:h-4" />
                      Tutup
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  <div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm inline-flex items-center mb-2 sm:mb-3">
                      <User size={12} className="mr-1.5 sm:mr-2 sm:w-3 sm:h-3" />
                      {selectedInvoice.nama_lengkap}
                    </div>
                    <h3 className="font-bold text-lg sm:text-2xl mb-1 sm:mb-2">{selectedInvoice.payment_id}</h3>
                    <div className="flex items-center text-blue-100 text-xs sm:text-sm">
                      <Calendar size={12} className="mr-1.5 sm:mr-2 sm:w-3 sm:h-3" />
                      {selectedInvoice.payment_date ? new Date(selectedInvoice.payment_date).toLocaleString('id-ID') : '-' }
                    </div>
                    {selectedInvoice.appointment_code && (
                      <div className="flex items-center text-blue-100 text-xs sm:text-sm mt-1">
                        <FileText size={12} className="mr-1.5 sm:mr-2 sm:w-3 sm:h-3" />
                        Appt: {selectedInvoice.appointment_code}
                      </div>
                    )}
                    {selectedInvoice.appointment_status === 'completed' && selectedInvoice.status_updated_at && (
                        <div className="flex items-center text-green-200 text-xs mt-1 sm:mt-2 font-semibold">
                          <Archive size={12} className="mr-1.5 sm:mr-2 sm:w-3 sm:h-3" />
                          Ditutup: {new Date(selectedInvoice.status_updated_at).toLocaleString('id-ID')}
                        </div>
                    )}
                  </div>
                  
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 sm:p-4 text-center">
                    <div className="text-blue-100 text-xs sm:text-sm mb-1 sm:mb-2">Total Tagihan</div>
                    <div className="text-lg sm:text-2xl font-bold">Rp {Number(selectedInvoice.total).toLocaleString('id-ID')}</div>
                    <div className="mt-2 sm:mt-3">
                      {isFullyPaid(selectedInvoice) ? (
                        <div className="flex items-center justify-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-green-500/30 text-white text-xs font-bold">
                          <CheckCircle size={10} className="mr-1 sm:mr-1.5 sm:w-3 sm:h-3" />
                          Lunas
                        </div>
                      ) : (
                        <div className="flex items-center justify-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-amber-500/30 text-white text-xs font-bold">
                          <Clock size={10} className="mr-1 sm:mr-1.5 sm:w-3 sm:h-3" />
                          Belum Lunas
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 sm:p-4 text-center">
                    <div className="text-blue-100 text-xs sm:text-sm mb-1 sm:mb-2">Sisa Tagihan</div>
                    <div className="text-lg sm:text-2xl font-bold">Rp {getRemainingBalance(selectedInvoice).toLocaleString('id-ID')}</div>
                    <div className="mt-2 sm:mt-3">
                      <div className="flex items-center justify-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-blue-500/30 text-white text-xs font-bold">
                        <Percent size={10} className="mr-1 sm:mr-1.5 sm:w-3 sm:h-3" />
                        {getPaymentPercentage(selectedInvoice)}% Terbayar
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice Content */}
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                  {/* Left Column: Invoice Details */}
                  <div className="space-y-4 sm:space-y-6">
                    {/* Pelayanan Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <h3 className="font-bold text-gray-800 flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent text-sm sm:text-base">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-2 shadow-sm">
                            <Stethoscope size={12} className="text-white sm:w-3 sm:h-3" />
                          </div>
                          Pelayanan
                        </h3>
                        <div className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-bold flex items-center">
                          {selectedInvoice.items.filter(i => i.pay_item_type === 'SERVICE').length} items
                        </div>
                      </div>
                      
                      {selectedInvoice.items.filter(i => i.pay_item_type === 'SERVICE').length === 0 ? (
                        <div className="text-center py-4 sm:py-6 text-gray-400 bg-gray-50 rounded-xl">
                          <Stethoscope size={20} className="mx-auto mb-2 text-gray-300 sm:w-6 sm:h-6" />
                          <span className="text-xs sm:text-sm">Tidak ada data pelayanan</span>
                        </div>
                      ) : (
                        <div className="space-y-2 sm:space-y-3">
                          {selectedInvoice.items.filter(i => i.pay_item_type === 'SERVICE').map((item, idx) => (
                            <div key={idx} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-3 sm:p-4 hover:shadow-lg transition-all duration-300">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-bold text-gray-900 text-xs sm:text-sm">{item.item_name}</h4>
                                  <div className="flex items-center gap-3 sm:gap-4 mt-1.5 sm:mt-2 text-xs text-gray-600">
                                    <span className="flex items-center">
                                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full mr-1 sm:mr-1.5"></div>
                                      Qty: {item.quantity}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-gray-900 text-xs sm:text-sm">Rp {Number(item.price).toLocaleString('id-ID')}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Obat Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <h3 className="font-bold text-gray-800 flex items-center bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent text-sm sm:text-base">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-2 shadow-sm">
                            <Pill size={12} className="text-white sm:w-3 sm:h-3" />
                          </div>
                          Obat
                        </h3>
                        <div className="bg-green-100 text-green-800 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-bold flex items-center">
                          {selectedInvoice.items.filter(i => i.pay_item_type === 'MEDECINE').length} items
                        </div>
                      </div>
                      
                      {selectedInvoice.items.filter(i => i.pay_item_type === 'MEDECINE').length === 0 ? (
                        <div className="text-center py-4 sm:py-6 text-gray-400 bg-gray-50 rounded-xl">
                          <Pill size={20} className="mx-auto mb-2 text-gray-300 sm:w-6 sm:h-6" />
                          <span className="text-xs sm:text-sm">Tidak ada data obat</span>
                        </div>
                      ) : (
                        <div className="space-y-2 sm:space-y-3">
                          {selectedInvoice.items.filter(i => i.pay_item_type === 'MEDECINE').map((item, idx) => (
                            <div key={idx} className="bg-gradient-to-br from-green-50 to-white border border-green-200 rounded-xl p-3 sm:p-4 hover:shadow-lg transition-all duration-300">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-bold text-gray-900 text-xs sm:text-sm flex items-center">
                                    <Pill size={12} className="mr-1.5 sm:mr-2 text-green-600 sm:w-3 sm:h-3" />
                                    {item.item_name}
                                  </h4>
                                  <div className="flex items-center gap-3 sm:gap-4 mt-1.5 sm:mt-2 text-xs text-gray-600">
                                    <span className="flex items-center">
                                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full mr-1 sm:mr-1.5"></div>
                                      Qty: {item.quantity}
                                    </span>
                                    <span className="flex items-center">
                                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full mr-1 sm:mr-1.5"></div>
                                      Satuan: Rp {Number(item.price).toLocaleString('id-ID')}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-green-700 text-xs sm:text-sm">Rp {(Number(item.price) * Number(item.quantity)).toLocaleString('id-ID')}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Right Column: Payment Section */}
                  <div className="space-y-4 sm:space-y-6">
                    {/* Summary Section */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-3 sm:p-4 border border-blue-100">
                      <h3 className="font-bold text-gray-800 mb-3 sm:mb-4 flex items-center text-sm sm:text-base">
                        <Calculator size={16} className="mr-2 text-blue-600 sm:w-4 sm:h-4" />
                        Ringkasan Pembayaran
                      </h3>
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 font-medium text-xs sm:text-sm">Subtotal Pelayanan</span>
                          <span className="font-bold text-gray-800 text-xs sm:text-sm">Rp {selectedInvoice.items.filter(i => i.pay_item_type === 'SERVICE').reduce((a,b)=>a+Number(b.price||0),0).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 font-medium text-xs sm:text-sm">Subtotal Obat</span>
                          <span className="font-bold text-gray-800 text-xs sm:text-sm">Rp {selectedInvoice.items.filter(i => i.pay_item_type === 'MEDECINE').reduce((a,b)=>a+Number(b.price||0),0).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="border-t border-blue-200 pt-2 sm:pt-3">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-gray-800 text-sm sm:text-lg">Total</span>
                            <span className="font-bold text-blue-700 text-sm sm:text-lg">Rp {Number(selectedInvoice.total).toLocaleString('id-ID')}</span>
                          </div>
                        </div>

                        {selectedInvoice.paid_amount && (
                          <>
                            <div className="border-t border-blue-200 pt-2 sm:pt-3">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600 font-medium text-xs sm:text-sm">Sudah Dibayar</span>
                                <span className="font-bold text-green-600 text-xs sm:text-sm">Rp {Number(selectedInvoice.paid_amount).toLocaleString('id-ID')}</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 font-medium text-xs sm:text-sm">Sisa Tagihan</span>
                              <span className="font-bold text-red-600 text-sm sm:text-lg">Rp {getRemainingBalance(selectedInvoice).toLocaleString('id-ID')}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Payment Form */}
                    {selectedInvoice.appointment_status !== 'completed' ? (
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-3 sm:p-4 border border-amber-100">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <h3 className="font-bold text-gray-800 flex items-center text-sm sm:text-base">
                            <Wallet size={16} className="mr-2 text-amber-600 sm:w-4 sm:h-4" />
                            Proses Pembayaran
                          </h3>
                          <button
                            onClick={() => setShowPaymentForm(!showPaymentForm)}
                            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center ${
                              showPaymentForm 
                                ? 'bg-amber-500 text-white shadow-lg' 
                                : 'bg-white/80 text-amber-700 border border-amber-200 hover:bg-amber-500 hover:text-white'
                            }`}
                          >
                            {showPaymentForm ? <XCircle size={14} className="mr-1.5 sm:mr-2 sm:w-4 sm:h-4" /> : <Plus size={14} className="mr-1.5 sm:mr-2 sm:w-4 sm:h-4" />}
                            {showPaymentForm ? 'Batal' : 'Bayar'}
                          </button>
                        </div>
                        
                        {showPaymentForm && (
                          <div className="space-y-3 sm:space-y-4 animate-fade-in">
                            <div>
                              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Jumlah Pembayaran</label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4 pointer-events-none text-gray-500 font-semibold text-xs sm:text-sm">
                                  Rp
                                </div>
                                <input
                                  type="text"
                                  value={formatRupiah(paymentData.amount, false)}
                                  onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                                  placeholder="0"
                                  className="w-full pl-8 sm:pl-12 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-300 text-xs sm:text-sm font-medium text-right"
                                />
                              </div>
                              
                              {(() => {
                                const tenderedAmount = Number(parseRupiah(paymentData.amount)) || 0;
                                const remainingBalance = getRemainingBalance(selectedInvoice);
                                const change = tenderedAmount > remainingBalance ? tenderedAmount - remainingBalance : 0;

                                return (
                                  <>
                                    <p className="text-xs text-gray-500 mt-1">Sisa tagihan: {formatRupiah(remainingBalance)}</p>
                                    {change > 0 && (
                                      <div className="mt-2 p-2 bg-green-100 border-l-4 border-green-500 text-green-800 text-xs sm:text-sm rounded-r-lg">
                                        <div className="flex items-center">
                                          <Info size={14} className="mr-1.5 sm:mr-2 sm:w-4 sm:h-4"/>
                                          <span className="font-bold">Kembalian: {formatRupiah(change)}</span>
                                        </div>
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                            
                            <div>
                              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Metode Pembayaran</label>
                              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                {[
                                  { value: 'cash', label: 'Tunai', icon: Banknote },
                                  { value: 'debit', label: 'Debit', icon: CreditCardIcon },
                                  { value: 'transfer', label: 'Transfer', icon: Receipt }
                                ].map((method) => (
                                  <button 
                                    key={method.value}
                                    onClick={() => setPaymentData({...paymentData, method: method.value})}
                                    className={`p-2 sm:p-3 rounded-xl border-2 transition-all duration-300 flex flex-col items-center ${
                                      paymentData.method === method.value
                                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                                        : 'border-gray-200 bg-white hover:border-amber-300'
                                    }`}
                                  >
                                    <method.icon size={16} className="mb-1 sm:w-5 sm:h-5" />
                                    <span className="text-xs font-medium">{method.label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Referensi (Opsional)</label>
                              <input
                                type="text"
                                value={paymentData.reference}
                                onChange={(e) => setPaymentData({...paymentData, reference: e.target.value})}
                                placeholder="Nomor referensi pembayaran"
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-300 text-xs sm:text-sm font-medium"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Catatan (Opsional)</label>
                              <textarea
                                value={paymentData.notes}
                                onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                                placeholder="Catatan tambahan"
                                rows="2"
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-300 text-xs sm:text-sm font-medium resize-none"
                              />
                            </div>
                            
                            <button 
                              onClick={handlePaymentSubmit}
                              disabled={processingPayment || !paymentData.amount || Number(parseRupiah(paymentData.amount)) <= 0}
                              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transform disabled:scale-100 text-xs sm:text-sm"
                            >
                              {processingPayment ? (
                                <Loader2 className="animate-spin mr-1.5 sm:mr-2" size={16} />
                              ) : (
                                <Zap className="mr-1.5 sm:mr-2" size={16} />
                              )}
                              {processingPayment ? 'Memproses...' : 'Proses Pembayaran'}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-4 sm:p-6 border border-gray-200 text-center">
                        <Lock size={20} className="mx-auto text-gray-500 mb-2 sm:mb-3 sm:w-6 sm:h-6"/>
                        <h3 className="font-bold text-gray-800 text-sm sm:text-base">Invoice Ditutup</h3>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                          Invoice ini sudah ditutup dan tidak dapat diedit. <br/> Aktifkan kembali untuk membuat perubahan.
                        </p>
                      </div>
                    )}

                    {/* Payment History */}
                    {selectedInvoice.paid_amount && (
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-3 sm:p-4 border border-green-100">
                        <h3 className="font-bold text-gray-800 mb-3 sm:mb-4 flex items-center text-sm sm:text-base">
                          <Receipt size={16} className="mr-2 text-green-600 sm:w-4 sm:h-4" />
                          Riwayat Pembayaran
                        </h3>
                        <div className="space-y-2 sm:space-y-3">
                          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-green-200">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-bold text-gray-800 text-xs sm:text-sm">Pembayaran Pertama</div>
                                <div className="text-xs sm:text-sm text-gray-600">
                                  {selectedInvoice.payment_date ? new Date(selectedInvoice.payment_date).toLocaleString('id-ID') : '-'}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-green-700 text-xs sm:text-sm">Rp {Number(selectedInvoice.paid_amount).toLocaleString('id-ID')}</div>
                                <div className="text-xs text-gray-500">
                                  via {selectedInvoice.method ? selectedInvoice.method.charAt(0).toUpperCase() + selectedInvoice.method.slice(1) : '-'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-6 sm:p-8 text-center border border-gray-100">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                <FileText size={32} className="text-gray-400 sm:w-10 sm:h-10" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-2 sm:mb-3">Tidak Ada Invoice Dipilih</h3>
              <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 max-w-sm mx-auto">
                Pilih invoice dari daftar untuk melihat detail pembayaran dan melakukan transaksi
              </p>
              <div className="bg-blue-50 text-blue-700 p-3 sm:p-4 rounded-xl inline-flex items-center text-xs sm:text-sm font-medium">
                <ChevronRight size={14} className="mr-1.5 sm:mr-2 sm:w-4 sm:h-4" />
                <span className="xl:hidden">Klik pada invoice di atas</span>
                <span className="hidden xl:inline">Klik pada invoice di sebelah kiri</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {showConfirmReset && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full m-4">
                <div className="text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <AlertTriangle size={24} className="text-red-600 sm:w-8 sm:h-8"/>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800">Reset Pembayaran?</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-2">
                        Anda yakin ingin mereset semua pembayaran untuk invoice <strong>{selectedInvoice?.payment_id}</strong>? Tindakan ini akan menghapus seluruh jumlah yang telah dibayar dan tidak dapat dibatalkan.
                    </p>
                </div>
                <div className="mt-6 sm:mt-8 flex justify-end gap-3 sm:gap-4">
                    <button
                        onClick={() => setShowConfirmReset(false)}
                        className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition text-xs sm:text-sm"
                        disabled={isProcessingAction}
                    >
                        Batal
                    </button>
                    <button
                        onClick={() => handleInvoiceAction('reset')}
                        className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 transition flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
                        disabled={isProcessingAction}
                    >
                        {isProcessingAction ? <Loader2 size={14} className="animate-spin sm:w-4 sm:h-4"/> : <RotateCcw size={14} className="sm:w-4 sm:h-4" />}
                        {isProcessingAction ? 'Mereset...' : 'Ya, Reset Pembayaran'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Success/Error Notifications */}
      {(success || error) && (
        <div
          className={`fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 rounded-xl shadow-lg px-4 sm:px-6 py-3 sm:py-4 animate-fade-in flex items-center gap-2 sm:gap-3 ${
            success
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {success ? <CheckCircle size={20} className="sm:w-6 sm:h-6" /> : <AlertTriangle size={20} className="sm:w-6 sm:h-6" />}
          <div>
            <p className="font-bold text-xs sm:text-sm">{success ? "Berhasil" : "Gagal"}</p>
            <p className="text-xs sm:text-sm">{success || error}</p>
          </div>
          <button
            onClick={() => {
              setSuccess("");
              setError("");
            }}
            className="absolute top-1 sm:top-2 right-1 sm:right-2 p-1 rounded-full hover:bg-black/10"
          >
            <XCircle size={16} className="sm:w-4 sm:h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default Pembayaran;