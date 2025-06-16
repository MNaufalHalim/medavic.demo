import React, { useEffect, useState } from 'react';
import PageTemplate from '../../components/PageTemplate';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { 
  User, Calendar, Pill, Activity, Loader2, ArrowUpRight, ArrowDownRight, 
  Clock, Stethoscope, Hospital, FileText, DollarSign, Package, ChevronRight, 
  Search, Filter, TrendingUp, Users, ClipboardList, AlertCircle, CheckCircle2,
  ArrowRight, ChevronDown, MoreHorizontal, Download, RefreshCw
} from 'lucide-react';
import config from '../../config';

const DUMMY_LINE = {
  today: [
    { time: '08:00', pasien: 15, rawat: 5 },
    { time: '09:00', pasien: 25, rawat: 8 },
    { time: '10:00', pasien: 35, rawat: 12 },
    { time: '11:00', pasien: 28, rawat: 10 },
    { time: '12:00', pasien: 20, rawat: 7 },
    { time: '13:00', pasien: 30, rawat: 9 },
    { time: '14:00', pasien: 40, rawat: 15 },
    { time: '15:00', pasien: 32, rawat: 11 },
  ],
  month: [
    { day: '1', pasien: 150, rawat: 45 },
    { day: '5', pasien: 180, rawat: 55 },
    { day: '10', pasien: 220, rawat: 65 },
    { day: '15', pasien: 280, rawat: 85 },
    { day: '20', pasien: 250, rawat: 75 },
    { day: '25', pasien: 300, rawat: 90 },
    { day: '30', pasien: 270, rawat: 80 },
  ],
  year: [
    { month: 'Jan', pasien: 950, rawat: 450 },
    { month: 'Feb', pasien: 792, rawat: 380 },
    { month: 'Mar', pasien: 501, rawat: 250 },
    { month: 'Apr', pasien: 800, rawat: 400 },
    { month: 'Mei', pasien: 500, rawat: 300 },
    { month: 'Jun', pasien: 500, rawat: 200 },
    { month: 'Jul', pasien: 280, rawat: 150 },
    { month: 'Agu', pasien: 350, rawat: 180 },
    { month: 'Sep', pasien: 420, rawat: 210 },
    { month: 'Okt', pasien: 380, rawat: 190 },
    { month: 'Nov', pasien: 450, rawat: 220 },
    { month: 'Des', pasien: 500, rawat: 250 },
  ]
};

const DUMMY_PIE = {
  today: [
    { name: 'Rawat Inap', value: 40, color: '#3B82F6' },
    { name: 'Rawat Jalan', value: 60, color: '#10B981' },
    { name: 'IGD', value: 20, color: '#F59E0B' },
    { name: 'Laboratorium', value: 15, color: '#EF4444' },
  ],
  month: [
    { name: 'Rawat Inap', value: 450, color: '#3B82F6' },
    { name: 'Rawat Jalan', value: 650, color: '#10B981' },
    { name: 'IGD', value: 250, color: '#F59E0B' },
    { name: 'Laboratorium', value: 150, color: '#EF4444' },
  ],
  year: [
    { name: 'Rawat Inap', value: 4500, color: '#3B82F6' },
    { name: 'Rawat Jalan', value: 6500, color: '#10B981' },
    { name: 'IGD', value: 2500, color: '#F59E0B' },
    { name: 'Laboratorium', value: 1500, color: '#EF4444' },
  ]
};

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

const Dashboard = () => {
  const [summary, setSummary] = useState({
    totalPatients: 0,
    totalVisits: 0,
    totalMedicines: 0,
    waitingPatients: 0,
    completedPatients: 0,
    todayIncome: {
      total: 0,
      medicine: 0,
      service: 0
    },
    medicineStock: {
      total: 0,
      lowStock: 0,
      outOfStock: 0
    },
    loading: true
  });
  const [patients, setPatients] = useState([]);
  const [timeFilter, setTimeFilter] = useState('today'); // 'today', 'month', 'year'
  const [incomeData, setIncomeData] = useState([]);
  const [visitData, setVisitData] = useState({
    today: [],
    month: [],
    year: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchVisitData();
  }, [timeFilter]);

  const fetchDashboardData = async () => {
    setSummary(s => ({ ...s, loading: true }));
    try {
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0];

      // Fetch data kunjungan hari ini
      const visitsRes = await axios.get(`${config.apiUrl}/rm/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          start_date: today,
          end_date: today
        }
      });

      // Fetch data pasien
      const patientsRes = await axios.get(`${config.apiUrl}/master/patients`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch data obat
      const medicinesRes = await axios.get(`${config.apiUrl}/master/medicines`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Hitung statistik dari data kunjungan
      const todayVisits = visitsRes.data.data;
      const totalVisits = todayVisits.length;
      
      // Hitung jumlah pasien yang menunggu (status: scheduled)
      const waitingPatients = todayVisits.filter(visit => visit.status === 'scheduled').length;
      
      // Hitung jumlah pasien yang selesai (status: completed)
      const completedPatients = todayVisits.filter(visit => visit.status === 'completed').length;

      // Hitung pendapatan (dummy data untuk sementara)
      const dummyIncome = {
        today: {
          total: 2500000,
          medicine: 800000,
          service: 1700000
        },
        month: {
          total: 75000000,
          medicine: 25000000,
          service: 50000000
        },
        year: {
          total: 900000000,
          medicine: 300000000,
          service: 600000000
        }
      };

      // Hitung stok obat (dummy data untuk sementara)
      const dummyStock = {
        total: medicinesRes.data.data.length,
        lowStock: medicinesRes.data.data.filter(med => med.stock < 10).length,
        outOfStock: medicinesRes.data.data.filter(med => med.stock === 0).length
      };

      setSummary({
        totalPatients: patientsRes.data.data.length,
        totalVisits: totalVisits,
        totalMedicines: medicinesRes.data.data.length,
        waitingPatients: waitingPatients,
        completedPatients: completedPatients,
        todayIncome: dummyIncome[timeFilter],
        medicineStock: dummyStock,
        loading: false
      });

      // Ambil 5 pasien terbaru
      setPatients(patientsRes.data.data.slice(0, 5));

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setSummary(s => ({ ...s, loading: false }));
    }
  };

  const fetchVisitData = async () => {
    try {
      const token = localStorage.getItem('token');
      const today = new Date();
      let startDate, endDate;

      switch(timeFilter) {
        case 'today':
          startDate = today.toISOString().split('T')[0];
          endDate = startDate;
          break;
        case 'month':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
          endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
          break;
        case 'year':
          startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
          endDate = new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0];
          break;
      }

      const response = await axios.get(`${config.apiUrl}/rm/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { start_date: startDate, end_date: endDate }
      });

      if (response.data.status === 'success') {
        const appointments = response.data.data;
        
        // Proses data berdasarkan filter waktu
        let processedData = [];
        if (timeFilter === 'today') {
          // Kelompokkan berdasarkan jam
          const hourlyData = {};
          appointments.forEach(apt => {
            const hour = apt.appointment_time.split(':')[0];
            if (!hourlyData[hour]) {
              hourlyData[hour] = { time: `${hour}:00`, pasien: 0, rawat: 0 };
            }
            hourlyData[hour].pasien++;
            if (apt.type === 'rawat_inap') {
              hourlyData[hour].rawat++;
            }
          });
          processedData = Object.values(hourlyData).sort((a, b) => a.time.localeCompare(b.time));
        } else if (timeFilter === 'month') {
          // Kelompokkan berdasarkan tanggal
          const dailyData = {};
          appointments.forEach(apt => {
            const day = apt.appointment_date.split('-')[2];
            if (!dailyData[day]) {
              dailyData[day] = { day, pasien: 0, rawat: 0 };
            }
            dailyData[day].pasien++;
            if (apt.type === 'rawat_inap') {
              dailyData[day].rawat++;
            }
          });
          processedData = Object.values(dailyData).sort((a, b) => parseInt(a.day) - parseInt(b.day));
        } else {
          // Kelompokkan berdasarkan bulan
          const monthlyData = {};
          appointments.forEach(apt => {
            const month = new Date(apt.appointment_date).toLocaleString('id-ID', { month: 'short' });
            if (!monthlyData[month]) {
              monthlyData[month] = { month, pasien: 0, rawat: 0 };
            }
            monthlyData[month].pasien++;
            if (apt.type === 'rawat_inap') {
              monthlyData[month].rawat++;
            }
          });
          processedData = Object.values(monthlyData);
        }

        setVisitData(prev => ({
          ...prev,
          [timeFilter]: processedData
        }));

        // Update summary
        setSummary(prev => ({
          ...prev,
          totalVisits: appointments.length,
          waitingPatients: appointments.filter(apt => apt.status === 'waiting').length,
          completedPatients: appointments.filter(apt => apt.status === 'completed').length
        }));
      }
    } catch (error) {
      console.error('Error fetching visit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getChartData = () => {
    return {
      lineData: DUMMY_LINE[timeFilter],
      pieData: DUMMY_PIE[timeFilter]
    };
  };

  const getXAxisKey = () => {
    switch(timeFilter) {
      case 'today': return 'time';
      case 'month': return 'day';
      case 'year': return 'month';
      default: return 'time';
    }
  };

  const getXAxisLabel = () => {
    switch(timeFilter) {
      case 'today': return 'Waktu';
      case 'month': return 'Tanggal';
      case 'year': return 'Bulan';
      default: return 'Waktu';
    }
  };

  return (
    <PageTemplate title={null}>
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <Hospital size={24} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">Welcome back, <span className="text-blue-700 animate-fade-in">User</span> <span className="inline-block animate-wiggle">👋</span></h2>
                  <div className="text-gray-500 text-sm animate-fade-in-up">Berikut adalah ringkasan aktivitas klinik hari ini</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select 
                    className="appearance-none bg-white border border-gray-200 rounded-xl pl-4 pr-10 py-2.5 text-sm text-gray-700 focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                  >
                    <option value="today">Hari Ini</option>
                    <option value="month">Bulan Ini</option>
                    <option value="year">Tahun Ini</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <ChevronDown size={16} />
                  </div>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm transition-all duration-200">
                  <FileText size={16} /> Export Laporan
                </button>
                <button className="bg-white border border-gray-200 text-gray-700 px-3 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-gray-50 transition">
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Total Kunjungan */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-blue-50 rounded-xl group-hover:scale-110 transition-transform duration-200">
                  <Users size={22} className="text-blue-600" />
                </div>
                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <TrendingUp size={14} /> +2.1%
                </span>
              </div>
              <div className="mb-1">
                <span className="text-2xl font-bold text-gray-800">
                  {summary.loading ? <Loader2 className="animate-spin" /> : summary.totalVisits}
                </span>
              </div>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                Total Kunjungan Hari Ini
                <span className="text-blue-600 cursor-pointer hover:text-blue-700">
                  <ArrowRight size={14} />
                </span>
              </div>
            </div>

            {/* Menunggu Antrian */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-amber-50 rounded-xl group-hover:scale-110 transition-transform duration-200">
                  <Clock size={22} className="text-amber-600" />
                </div>
                <span className="text-sm font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <ArrowDownRight size={14} /> -1.5%
                </span>
              </div>
              <div className="mb-1">
                <span className="text-2xl font-bold text-gray-800">
                  {summary.loading ? <Loader2 className="animate-spin" /> : summary.waitingPatients}
                </span>
              </div>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                Menunggu Pemeriksaan
                <span className="text-amber-600 cursor-pointer hover:text-amber-700">
                  <ArrowRight size={14} />
                </span>
              </div>
            </div>

            {/* Selesai */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-emerald-50 rounded-xl group-hover:scale-110 transition-transform duration-200">
                  <CheckCircle2 size={22} className="text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <TrendingUp size={14} /> +5.2%
                </span>
              </div>
              <div className="mb-1">
                <span className="text-2xl font-bold text-gray-800">
                  {summary.loading ? <Loader2 className="animate-spin" /> : summary.completedPatients}
                </span>
              </div>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                Selesai Diperiksa
                <span className="text-emerald-600 cursor-pointer hover:text-emerald-700">
                  <ArrowRight size={14} />
                </span>
              </div>
            </div>

            {/* Total Pendapatan */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-purple-50 rounded-xl group-hover:scale-110 transition-transform duration-200">
                  <DollarSign size={22} className="text-purple-600" />
                </div>
                <span className="text-sm font-medium text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <TrendingUp size={14} /> +8.2%
                </span>
              </div>
              <div className="mb-1">
                <span className="text-2xl font-bold text-gray-800">
                  {summary.loading ? <Loader2 className="animate-spin" /> : formatCurrency(summary.todayIncome.total)}
                </span>
              </div>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                Total Pendapatan
                <span className="text-purple-600 cursor-pointer hover:text-purple-700">
                  <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Statistik Kunjungan */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-xl">
                    <TrendingUp size={20} className="text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Statistik Kunjungan</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    className={`text-sm px-3 py-1.5 rounded-lg transition ${timeFilter === 'today' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    onClick={() => setTimeFilter('today')}
                  >
                    Hari
                  </button>
                  <button 
                    className={`text-sm px-3 py-1.5 rounded-lg transition ${timeFilter === 'month' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    onClick={() => setTimeFilter('month')}
                  >
                    Bulan
                  </button>
                  <button 
                    className={`text-sm px-3 py-1.5 rounded-lg transition ${timeFilter === 'year' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    onClick={() => setTimeFilter('year')}
                  >
                    Tahun
                  </button>
                </div>
              </div>
              <div className="h-[300px]">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="animate-spin text-blue-600" size={32} />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={visitData[timeFilter]} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ef" />
                      <XAxis 
                        dataKey={timeFilter === 'today' ? 'time' : timeFilter === 'month' ? 'day' : 'month'} 
                        fontSize={13} 
                        stroke="#64748b"
                        label={{ 
                          value: timeFilter === 'today' ? 'Waktu' : timeFilter === 'month' ? 'Tanggal' : 'Bulan', 
                          position: 'insideBottom', 
                          offset: -5 
                        }}
                      />
                      <YAxis allowDecimals={false} fontSize={13} stroke="#64748b" />
                      <Tooltip 
                        contentStyle={{ background: '#fff', borderRadius: 8, color: '#334155', border: '1px solid #e0e7ef' }} 
                        labelStyle={{ color: '#334155' }} 
                        itemStyle={{ color: '#334155' }}
                        formatter={(value) => [`${value} pasien`, '']}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="pasien" 
                        stroke="#3B82F6" 
                        strokeWidth={3} 
                        dot={{ r: 5, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }} 
                        activeDot={{ r: 7 }} 
                        name="Kunjungan" 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="rawat" 
                        stroke="#10B981" 
                        strokeWidth={3} 
                        dot={{ r: 5, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }} 
                        activeDot={{ r: 7 }} 
                        name="Rawat Inap" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Distribusi Pendapatan */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-50 rounded-xl">
                  <PieChart size={20} className="text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Distribusi Layanan</h3>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getChartData().pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {getChartData().pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: '#fff', borderRadius: 8, color: '#334155', border: '1px solid #e0e7ef' }}
                      formatter={(value) => [`${value} pasien`, '']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Income Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Pendapatan Obat */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 group hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-50 rounded-xl group-hover:scale-110 transition-transform duration-200">
                    <Pill size={22} className="text-rose-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Pendapatan Obat</h3>
                </div>
                <span className="text-sm font-medium text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <TrendingUp size={14} /> +3.2%
                </span>
              </div>
              <div className="mb-2">
                <span className="text-3xl font-bold text-gray-800">{summary.loading ? <Loader2 className="animate-spin" /> : formatCurrency(summary.todayIncome.medicine)}</span>
              </div>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                {timeFilter === 'today' ? 'Pendapatan obat hari ini' : 
                 timeFilter === 'month' ? 'Pendapatan obat bulan ini' : 
                 'Pendapatan obat tahun ini'}
                <span className="text-rose-600 cursor-pointer hover:text-rose-700">
                  <ArrowRight size={14} />
                </span>
              </div>
            </div>

            {/* Pendapatan Layanan */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 group hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 rounded-xl group-hover:scale-110 transition-transform duration-200">
                    <Stethoscope size={22} className="text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Pendapatan Layanan</h3>
                </div>
                <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <TrendingUp size={14} /> +5.1%
                </span>
              </div>
              <div className="mb-2">
                <span className="text-3xl font-bold text-gray-800">{summary.loading ? <Loader2 className="animate-spin" /> : formatCurrency(summary.todayIncome.service)}</span>
              </div>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                {timeFilter === 'today' ? 'Pendapatan layanan hari ini' : 
                 timeFilter === 'month' ? 'Pendapatan layanan bulan ini' : 
                 'Pendapatan layanan tahun ini'}
                <span className="text-indigo-600 cursor-pointer hover:text-indigo-700">
                  <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </div>

          {/* Recent Patients Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-xl">
                    <ClipboardList size={20} className="text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Daftar Pasien Terbaru</h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Cari pasien..." 
                      className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500 w-full md:w-64"
                    />
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                  <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-gray-50 transition">
                    <Filter size={16} /> Filter
                  </button>
                  <button className="bg-white border border-gray-200 text-gray-700 p-2 rounded-xl font-medium hover:bg-gray-50 transition">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">No</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID Pasien</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Pasien</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Umur</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal Daftar</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Layanan</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {patients.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-400">Tidak ada data pasien</td>
                    </tr>
                  )}
                  {patients.map((p, idx) => (
                    <tr key={p.no_rm} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-blue-700">{String(idx + 1).padStart(2, '0')}</td>
                      <td className="px-6 py-4 font-mono text-gray-700">#{p.no_rm}</td>
                      <td className="px-6 py-4 font-medium text-gray-800">{p.nama_lengkap}</td>
                      <td className="px-6 py-4 text-gray-600">{p.umur || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">{p.created_at ? p.created_at.split('T')[0] : '-'}</td>
                      <td className="px-6 py-4 text-gray-600">Rawat Jalan</td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">Aktif</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
};

export default Dashboard;