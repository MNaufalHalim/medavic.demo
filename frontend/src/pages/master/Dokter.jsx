import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import PageTemplate from '../../components/PageTemplate';
import axios from 'axios';
import config from '../../config';
import { 
  AlertTriangle, Award, Calendar, CalendarClock, CalendarDays, CalendarPlus, CalendarOff, CalendarX2, CheckCircle, ChevronDown, Clock, Clock3, Clock9, Edit3, FileText, Filter, Info, Loader2, Mail, Phone, Plus, PlusCircle, Save, Search, Shield, Stethoscope, Trash2, User, Users, XCircle, MapPin, ShieldCheck, ShieldAlert, Sun, Activity, Wallet, Building2 
} from 'lucide-react';

const DAY_ORDER = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// Reusable DoctorInfoForm Component
const DoctorInfoForm = ({ doctor, onChange, isEditing, polyclinics, doctors = [] }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nama Lengkap */}
        <div className="relative group">
          {isEditing ? (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-sky-600 transition-colors duration-200">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                    <User size={14} className="text-white" />
                  </div>
                </div>
                <input
                  type="text"
                  value={doctor.name ?? ''}
                  onChange={(e) => onChange('name', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm transition-all duration-300 hover:border-sky-300"
                  placeholder="Masukkan nama lengkap dokter"
                  required
                />
              </div>
            </>
          ) : (
            <div className="flex items-start space-x-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-sky-100 transition-all duration-300">
              <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm">
                <User size={18} className="text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-500 mb-1">Nama Lengkap</p>
                {doctor.name ? (
                  <p className="text-sm text-gray-800 break-words">{doctor.name}</p>
                ) : (
                  <p className="text-sm text-gray-400 italic">Belum ada nama</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Spesialisasi */}
        <div className="relative group">
          {isEditing ? (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-sky-600 transition-colors duration-200">
                Spesialisasi <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                    <Stethoscope size={14} className="text-white" />
                  </div>
                </div>
                <input
                  type="text"
                  value={doctor.specialization ?? ''}
                  onChange={(e) => onChange('specialization', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm transition-all duration-300 hover:border-sky-300"
                  placeholder="Masukkan spesialisasi dokter"
                  required
                />
              </div>
            </>
          ) : (
            <div className="flex items-start space-x-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-sky-100 transition-all duration-300">
              <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm">
                <Stethoscope size={18} className="text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-500 mb-1">Spesialisasi</p>
                {doctor.specialization ? (
                  <p className="text-sm text-gray-800 break-words">{doctor.specialization}</p>
                ) : (
                  <p className="text-sm text-gray-400 italic">Belum ada spesialisasi</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Nomor SIP/STR */}
        <div className="relative group">
          {isEditing ? (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-sky-600 transition-colors duration-200">
                Nomor SIP/STR <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                    <Award size={14} className="text-white" />
                  </div>
                </div>
                <input
                  type="text"
                  value={doctor.license_no ?? ''}
                  onChange={(e) => onChange('license_no', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm transition-all duration-300 hover:border-sky-300 ${
                    doctor.license_no && doctor.license_no.length > 0 && (
                      doctor.license_no.length < 6 || 
                      doctor.license_no.length > 20 || 
                      !/^[A-Za-z0-9\-\.\/]+$/.test(doctor.license_no) ||
                      (() => {
                        const existingDoctor = doctors.find(doc => 
                          doc.license_no === doctor.license_no && 
                          doc.id !== doctor.id
                        );
                        return !!existingDoctor;
                      })()
                    )
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : doctor.license_no && doctor.license_no.length >= 6 && doctor.license_no.length <= 20 && /^[A-Za-z0-9\-\.\/]+$/.test(doctor.license_no)
                      ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                      : 'border-gray-200'
                  }`}
                  placeholder="Contoh: SIP.123456.789.2023"
                  required
                />
                {doctor.license_no && doctor.license_no.length >= 6 && doctor.license_no.length <= 20 && /^[A-Za-z0-9\-\.\/]+$/.test(doctor.license_no) && (() => {
                  const existingDoctor = doctors.find(doc => 
                    doc.license_no === doctor.license_no && 
                    doc.id !== doctor.id
                  );
                  return !existingDoctor;
                })() && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <CheckCircle size={16} className="text-green-500" />
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Masukkan nomor SIP (Surat Izin Praktik) atau STR (Surat Tanda Registrasi) dokter. Format: 6-20 karakter, boleh berisi huruf, angka, titik, dan garis miring.
              </p>
              {doctor.license_no && doctor.license_no.length > 0 && (doctor.license_no.length < 6 || doctor.license_no.length > 20) && (
                <p className="mt-1 text-xs text-red-500">
                  Nomor SIP/STR harus antara 6-20 karakter.
                </p>
              )}
              {doctor.license_no && doctor.license_no.length > 0 && !/^[A-Za-z0-9\-\.\/]+$/.test(doctor.license_no) && (
                <p className="mt-1 text-xs text-red-500">
                  Nomor SIP/STR dapat berisi huruf, angka, tanda hubung (-), titik (.), dan garis miring (/).
                </p>
              )}
              {doctor.license_no && doctor.license_no.length >= 6 && doctor.license_no.length <= 20 && /^[A-Za-z0-9\-\.\/]+$/.test(doctor.license_no) && (() => {
                const existingDoctor = doctors.find(doc => 
                  doc.license_no === doctor.license_no && 
                  doc.id !== doctor.id
                );
                return existingDoctor ? (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <XCircle size={12} />
                    Nomor SIP/STR sudah terdaftar untuk dokter lain
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-green-500 flex items-center gap-1">
                    <CheckCircle size={12} />
                    Format nomor SIP/STR valid
                  </p>
                );
              })()}
            </>
          ) : (
            <div className="flex items-start space-x-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-sky-100 transition-all duration-300">
              <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm">
                <Award size={18} className="text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-500 mb-1">Nomor SIP/STR</p>
                {doctor.license_no ? (
                  <p className="text-sm text-gray-800 break-words">{doctor.license_no}</p>
                ) : (
                  <p className="text-sm text-gray-400 italic">Belum ada nomor SIP/STR</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Email */}
        <div className="relative group">
          {isEditing ? (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-sky-600 transition-colors duration-200">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                    <Mail size={14} className="text-white" />
                  </div>
                </div>
                <input
                  type="email"
                  value={doctor.email ?? ''}
                  onChange={(e) => onChange('email', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm transition-all duration-300 hover:border-sky-300"
                  placeholder="Masukkan email dokter"
                />
              </div>
            </>
          ) : (
            <div className="flex items-start space-x-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-sky-100 transition-all duration-300">
              <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm">
                <Mail size={18} className="text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-500 mb-1">Email</p>
                {doctor.email ? (
                  <p className="text-sm text-gray-800 break-words">{doctor.email}</p>
                ) : (
                  <p className="text-sm text-gray-400 italic">Belum ada email</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Nomor Telepon */}
        <div className="relative group">
          {isEditing ? (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-sky-600 transition-colors duration-200">
                Nomor Telepon
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                    <Phone size={14} className="text-white" />
                  </div>
                </div>
                <input
                  type="tel"
                  value={doctor.phone_number ?? ''}
                  onChange={(e) => onChange('phone_number', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm transition-all duration-300 hover:border-sky-300"
                  placeholder="Masukkan nomor telepon dokter"
                />
              </div>
            </>
          ) : (
            <div className="flex items-start space-x-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-sky-100 transition-all duration-300">
              <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm">
                <Phone size={18} className="text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-500 mb-1">Nomor Telepon</p>
                {doctor.phone_number ? (
                  <p className="text-sm text-gray-800 break-words">{doctor.phone_number}</p>
                ) : (
                  <p className="text-sm text-gray-400 italic">Belum ada telepon</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="relative group">
          {isEditing ? (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-sky-600 transition-colors duration-200">
                Status <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                    <Activity size={14} className="text-white" />
                  </div>
                </div>
                <select
                  value={doctor.status === 'Active' ? 'Active' : 'Inactive'}
                  onChange={(e) => onChange('status', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm transition-all duration-300 hover:border-sky-300 appearance-none cursor-pointer"
                  required
                >
                  <option value="Active">Aktif</option>
                  <option value="Inactive">Tidak Aktif</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown size={18} className="text-gray-400 transition-transform duration-300 group-hover:scale-110" />
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-start space-x-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-sky-100 transition-all duration-300">
              {doctor.status === 'Active' ? (
                <div className="p-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-sm">
                  <ShieldCheck size={18} className="text-green-500" />
                </div>
              ) : (
                <div className="p-2 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg shadow-sm">
                  <ShieldAlert size={18} className="text-red-500" />
              </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-500 mb-1">Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  doctor.status === 'Active'
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-rose-100 text-rose-700'
                }`}>
                  {doctor.status === 'Active' ? 'Aktif' : 'Tidak Aktif'}
                  </span>
              </div>
            </div>
          )}
        </div>

        {/* Poli */}
        {isEditing ? (
          <div className="relative group">
            <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-sky-600 transition-colors duration-200">
              Poli
            </label>
            <div className="relative">
              <select
                value={doctor.poli || ''}
                onChange={e => onChange('poli', e.target.value)}
                className="w-full pl-4 pr-8 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm transition-all duration-300 hover:border-sky-300 appearance-none cursor-pointer"
              >
                <option value="">Pilih Poli</option>
                {polyclinics.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown size={18} className="text-gray-400" />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start space-x-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-sky-100 transition-all duration-300">
            <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm">
              <Building2 size={18} className="text-blue-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-500 mb-1">Poli</p>
              <p className="text-sm text-gray-800 break-words">{doctor.poli_name || 'N/A'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Reusable DoctorSchedule Component
const DoctorSchedule = ({ scheduleList, isEditing, onScheduleListChange }) => {
  const dayNameIndonesian = {
    sunday: 'Minggu', monday: 'Senin', tuesday: 'Selasa', wednesday: 'Rabu',
    thursday: 'Kamis', friday: 'Jumat', saturday: 'Sabtu'
  };

  const dayColors = {
    sunday: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: 'text-red-500' },
    monday: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: 'text-blue-500' },
    tuesday: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: 'text-green-500' },
    wednesday: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: 'text-yellow-500' },
    thursday: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: 'text-purple-500' },
    friday: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', icon: 'text-pink-500' },
    saturday: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: 'text-indigo-500' }
  };

  const dayIcons = {
    sunday: Sun,
    monday: Calendar,
    tuesday: Calendar,
    wednesday: Calendar,
    thursday: Calendar,
    friday: Calendar,
    saturday: Calendar
  };

  const handleAddSlot = () => {
    const newSlot = { temp_id: uuidv4(), day_of_week: 'monday', start_time: '', end_time: '' };
    onScheduleListChange([...scheduleList, newSlot]);
  };

  const handleRemoveSlot = (temp_id) => {
    onScheduleListChange(scheduleList.filter(s => s.temp_id !== temp_id));
  };

  const handleSlotChange = (temp_id, field, value) => {
    onScheduleListChange(scheduleList.map(s => s.temp_id === temp_id ? { ...s, [field]: value } : s));
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 7).map(hour => ({
    value: hour.toString().padStart(2, '0'),
    label: `${hour.toString().padStart(2, '0')}:00`
  }));

  const handleTimeChange = (temp_id, field, value) => {
    if (!value) {
      handleSlotChange(temp_id, field, '');
      return;
    }
    handleSlotChange(temp_id, field, `${value}:00`);
  };

  const isSlotInvalid = (slot) => {
    if (!slot.start_time || !slot.end_time) return false;
    const start = parseInt(slot.start_time.split(':')[0]);
    const end = parseInt(slot.end_time.split(':')[0]);
    return start >= end;
  };

  if (!isEditing && scheduleList.length === 0) {
    return (
      <section className="mt-6">
        <h4 className="text-xl font-semibold text-gray-700 flex items-center gap-2 pb-3 border-b border-gray-200 mb-6">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <CalendarClock size={20} className="text-indigo-600" />
          </div>
          Jadwal Praktik Dokter
        </h4>
        <div className="text-center p-12 bg-gradient-to-b from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-200">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-sky-100 rounded-full animate-pulse"></div>
            <CalendarOff size={48} className="text-sky-400 relative z-10 mx-auto" />
          </div>
          <h5 className="text-xl font-semibold text-gray-600 mb-3">Jadwal Belum Tersedia</h5>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            Belum ada jadwal praktik yang diatur. Silakan edit untuk menambahkan jadwal praktik dokter.
          </p>
          {/* <button
            onClick={() => setStateField('isEditing', true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 font-medium rounded-lg border border-sky-200 transition-all duration-300 hover:scale-105"
          >
            <PlusCircle size={18} />
            Tambah Jadwal
          </button> */}
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6 space-y-6">
      <h4 className="text-xl font-semibold text-gray-700 flex items-center gap-2 pb-3 border-b border-gray-200 mb-6">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
          {isEditing ? (
            <CalendarPlus size={20} className="text-indigo-600" />
          ) : (
            <CalendarClock size={20} className="text-indigo-600" />
          )}
        </div>
        {isEditing ? 'Atur Jadwal Praktik' : 'Jadwal Praktik Dokter'}
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scheduleList.map((slot) => {
          const DayIcon = dayIcons[slot.day_of_week];
          const colors = dayColors[slot.day_of_week];
          const slotInvalid = isSlotInvalid(slot);
          
          return (
            <div 
              key={slot.temp_id} 
              className={`group relative overflow-hidden rounded-xl border transition-all duration-300 animate-fade-in-sm hover:shadow-md ${
                isEditing 
                  ? 'bg-white hover:border-sky-300 hover:bg-sky-50' 
                  : `${colors.bg} ${colors.border}`
              }`}
            >
            {isEditing ? (
                <div className="p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Calendar size={18} className="text-gray-400 transition-transform duration-300 group-hover:scale-110" />
                        </div>
                <select 
                  value={slot.day_of_week} 
                  onChange={(e) => handleSlotChange(slot.temp_id, 'day_of_week', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm transition-all duration-300 hover:border-sky-300 appearance-none cursor-pointer"
                >
                          {DAY_ORDER.map(day => (
                            <option key={day} value={day} className="py-2">
                              {dayNameIndonesian[day]}
                            </option>
                          ))}
                </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <ChevronDown size={18} className="text-gray-400 transition-transform duration-300 group-hover:scale-110" />
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveSlot(slot.temp_id)} 
                      className="p-2.5 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all duration-300 border border-gray-200 hover:border-red-200"
                    >
                      <Trash2 size={18} className="transition-transform duration-300 hover:scale-110" />
                </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Clock3 size={18} className="text-gray-400" />
                      </div>
                      <div className="relative group">
                        <select
                          value={slot.start_time ? slot.start_time.split(':')[0] : ''}
                          onChange={(e) => handleTimeChange(slot.temp_id, 'start_time', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm transition-all duration-300 hover:border-sky-300 appearance-none cursor-pointer"
                        >
                          <option value="">Pilih Jam Mulai</option>
                          {hours.map(hour => (
                            <option key={hour.value} value={hour.value}>
                              {hour.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <ChevronDown size={18} className="text-gray-400 transition-transform duration-300 group-hover:scale-110" />
                        </div>
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
                          <div className="bg-gray-800 text-white text-xs rounded-lg py-1.5 px-3 whitespace-nowrap shadow-lg">
                            Pilih jam mulai praktik
                          </div>
                          <div className="w-2 h-2 bg-gray-800 transform rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1"></div>
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Clock9 size={18} className="text-gray-400" />
                      </div>
                      <div className="relative group">
                        <select
                          value={slot.end_time ? slot.end_time.split(':')[0] : ''}
                          onChange={(e) => handleTimeChange(slot.temp_id, 'end_time', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm transition-all duration-300 hover:border-sky-300 appearance-none cursor-pointer"
                        >
                          <option value="">Pilih Jam Selesai</option>
                          {hours.map(hour => (
                            <option key={hour.value} value={hour.value}>
                              {hour.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <ChevronDown size={18} className="text-gray-400 transition-transform duration-300 group-hover:scale-110" />
                        </div>
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
                          <div className="bg-gray-800 text-white text-xs rounded-lg py-1.5 px-3 whitespace-nowrap shadow-lg">
                            Pilih jam selesai praktik
                          </div>
                          <div className="w-2 h-2 bg-gray-800 transform rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {slotInvalid && (
                    <div className="mt-2 text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle size={14} />
                      Jam mulai harus lebih awal dari jam selesai.
                    </div>
                  )}
                  {slot.start_time && slot.end_time && !slotInvalid && (
                    <div className="mt-3 px-3 py-2 bg-sky-50 text-sky-700 rounded-lg text-sm flex items-center gap-2 animate-fade-in">
                      <Clock size={16} className="text-sky-500 transition-transform duration-300 group-hover:scale-110" />
                      <span>Durasi: {calculateDuration(slot.start_time, slot.end_time)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
                      <DayIcon size={20} className={colors.icon} />
                    </div>
                    <div>
                      <h5 className={`font-semibold ${colors.text}`}>
                        {dayNameIndonesian[slot.day_of_week]}
                      </h5>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={16} className="text-gray-400" />
                        <span>
                          {slot.start_time.substring(0,5)} - {slot.end_time.substring(0,5)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                      Aktif
                    </div>
                    <div className="text-xs text-gray-500">
                      Durasi: {calculateDuration(slot.start_time, slot.end_time)}
                    </div>
                  </div>
                </div>
            )}
          </div>
          );
        })}
      </div>

      {isEditing && (
        <button 
          onClick={handleAddSlot}
          className="mt-6 w-full flex items-center justify-center gap-2 bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold py-3 px-4 rounded-xl border-2 border-dashed border-sky-300 transition-all duration-300 hover:scale-[1.02] hover:shadow-md group"
        >
          <PlusCircle size={20} className="transition-transform duration-300 group-hover:rotate-90" />
          <span className="transition-all duration-300">Tambah Jadwal</span>
        </button>
      )}

      {!isEditing && scheduleList.length > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-sky-50 to-indigo-50 rounded-xl border border-sky-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
              <Info size={18} className="text-sky-600" />
            </div>
            <div>
              <h5 className="font-medium text-gray-800 mb-1">Informasi Jadwal</h5>
              <p className="text-sm text-gray-600">
                Jadwal praktik di atas menunjukkan waktu ketersediaan dokter untuk melayani pasien. 
                Setiap jadwal memiliki durasi praktik yang telah ditentukan.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

// Helper function to calculate duration
const calculateDuration = (start, end) => {
  if (!start || !end) return '';
  const startHour = parseInt(start.split(':')[0]);
  const endHour = parseInt(end.split(':')[0]);
  const diffHrs = endHour - startHour;
  return `${diffHrs} jam`;
};

const Dokter = () => {
  const [state, setState] = useState({
    doctorSearchTerm: '',
    doctors: [],
    selectedDoctor: null,
    editDoctor: null,
    loadingFetch: false,
    loadingSave: false,
    loadingDelete: false,
    error: '',
    success: '',
    scheduleList: [],
    removedScheduleIds: [],
    filter: 'all',
    isEditing: false,
    polyclinics: [],
    showNotif: false,
    notifType: '',
    notifMessage: '',
  });

  const {
    doctorSearchTerm,
    doctors,
    selectedDoctor,
    editDoctor,
    loadingFetch,
    loadingSave,
    loadingDelete,
    error,
    success,
    scheduleList,
    removedScheduleIds,
    filter,
    isEditing,
    polyclinics,
    showNotif,
    notifType,
    notifMessage,
  } = state;

  const setStateField = (field, value) => {
    setState((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    fetchDoctors();
    fetchPolyclinics();
  }, []);

  const fetchDoctors = useCallback(async () => {
    setStateField('loadingFetch', true);
    setStateField('error', '');
    try {
      const response = await axios.get(`${config.apiUrl}/master/doctors`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.data.status === 'success') {
        setStateField('doctors', response.data.data);
      } else {
        setStateField('error', response.data.message || 'Gagal memuat data dokter');
      }
    } catch {
      setStateField('error', 'Gagal memuat data dokter');
    } finally {
      setStateField('loadingFetch', false);
    }
  }, []);

  const fetchSchedules = useCallback(async (doctorId) => {
    try {
      const response = await axios.get(`${config.apiUrl}/master/doctor-schedules?doctor_id=${doctorId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const schedulesByDay = response.data.data;
      const flatScheduleList = Object.entries(schedulesByDay).flatMap(([day, slots]) => 
        slots.map(slot => ({...slot, day_of_week: day, temp_id: slot.id || uuidv4()}))
      );
      setStateField('scheduleList', flatScheduleList);
    } catch {
      setStateField('scheduleList', []);
    }
  }, []);

  const fetchPolyclinics = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${config.apiUrl}/master/polyclinics`, { headers: { Authorization: `Bearer ${token}` } });
      setStateField('polyclinics', res.data.data);
    } catch {}
  }, []);

  const handleSelectDoctor = useCallback((doc) => {
    setState((prev) => ({
      ...prev,
      selectedDoctor: doc,
      editDoctor: { ...doc },
      removedScheduleIds: [],
      error: '',
      success: '',
      isEditing: false,
    }));
    fetchSchedules(doc.id);
  }, [fetchSchedules]);

  const handleInputChange = useCallback((field, value) => {
    setState((prev) => ({
      ...prev,
      editDoctor: { ...prev.editDoctor, [field]: value },
    }));
  }, []);

  const handleScheduleListChange = useCallback((newScheduleList) => {
    setState(prev => ({
      ...prev,
      scheduleList: newScheduleList,
      editDoctor: {
        ...prev.editDoctor,
        schedule: newScheduleList
      }
    }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!editDoctor?.name || !editDoctor?.specialization || !editDoctor?.license_no) {
      setStateField('error', 'Nama, spesialisasi, dan nomor SIP/STR dokter wajib diisi.');
      return;
    }

    // Validasi format nomor SIP/STR (minimal 6 karakter, maksimal 20 karakter)
    if (editDoctor.license_no.length < 6 || editDoctor.license_no.length > 20) {
      setStateField('error', 'Nomor SIP/STR harus antara 6-20 karakter.');
      return;
    }

    // Validasi nomor SIP/STR hanya boleh berisi huruf, angka, dan tanda hubung
    const licenseNoRegex = /^[A-Za-z0-9\-\.\/]+$/;
    if (!licenseNoRegex.test(editDoctor.license_no)) {
      setStateField('error', 'Nomor SIP/STR hanya boleh berisi huruf, angka, tanda hubung (-), titik (.), dan garis miring (/).');
      return;
    }

    // Validasi duplikasi nomor SIP/STR
    const existingDoctor = doctors.find(doc => 
      doc.license_no === editDoctor.license_no && 
      doc.id !== editDoctor.id
    );
    if (existingDoctor) {
      setStateField('error', 'Nomor SIP/STR sudah terdaftar untuk dokter lain.');
      return;
    }

    setState((prev) => ({ ...prev, loadingSave: true, error: '', success: '' }));

    const finalSchedules = scheduleList
      .map(({ day_of_week, start_time, end_time }) => ({
        day_of_week,
        start_time,
        end_time,
        is_active: true,
      }))
      .filter(slot => slot.start_time && slot.end_time);

    const finalPayload = {
      ...editDoctor,
      schedule: finalSchedules,
    };
    
    delete finalPayload.scheduleList;

    try {
      let response;
      if (editDoctor.id) { // UPDATE
        response = await axios.put(
          `${config.apiUrl}/master/doctors/${editDoctor.id}`,
          finalPayload,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );

        if (response.data.status === 'success') {
          const schedulesByDay = response.data.data.schedule || {};
          const flatScheduleList = Object.entries(schedulesByDay).flatMap(([day, slots]) => 
            slots.map(slot => ({...slot, day_of_week: day, temp_id: slot.id || uuidv4()}))
          );
          await fetchDoctors(); // Refresh daftar dokter
          // Ambil data dokter terbaru dari doctors (setelah fetch)
          setState(prev => {
            const updatedDoctor = prev.doctors.find(d => d.id === editDoctor.id);
            return {
            ...prev,
            success: 'Data dokter berhasil diperbarui!',
            error: '',
            scheduleList: flatScheduleList,
            isEditing: false,
            loadingSave: false,
              selectedDoctor: updatedDoctor ? { ...updatedDoctor } : { ...editDoctor },
              editDoctor: updatedDoctor ? { ...updatedDoctor } : { ...editDoctor },
              showNotif: true,
              notifType: 'success',
              notifMessage: 'Data dokter berhasil diperbarui!',
            };
          });
          setTimeout(() => setStateField('showNotif', false), 4000);
        } else {
          setState(prev => ({
            ...prev,
            showNotif: true,
            notifType: 'error',
            notifMessage: response.data.message || 'Gagal memperbarui data.',
          }));
          setTimeout(() => setStateField('showNotif', false), 4000);
          throw new Error(response.data.message || 'Gagal memperbarui data.');
        }
      } else { // CREATE
        response = await axios.post(
          `${config.apiUrl}/master/doctors`,
          finalPayload,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );

        if (response.data.status === 'success') {
          const savedDoctorData = response.data.data;
          await fetchDoctors();
          
          // Auto-select the newly created doctor
          const newDoctor = {
            id: savedDoctorData.id,
            name: editDoctor.name,
            specialization: editDoctor.specialization,
            license_no: editDoctor.license_no,
            phone_number: editDoctor.phone_number,
            email: editDoctor.email,
            status: editDoctor.status,
            poli: editDoctor.poli,
            poli_name: polyclinics.find(p => p.id === editDoctor.poli)?.name || 'N/A'
          };
          
          setState(prev => ({
            ...prev,
            success: 'Dokter baru berhasil ditambahkan!',
            error: '',
            selectedDoctor: newDoctor,
            editDoctor: { ...newDoctor },
            isEditing: false,
            loadingSave: false,
            showNotif: true,
            notifType: 'success',
            notifMessage: 'Dokter baru berhasil ditambahkan!',
          }));
          
          // Fetch schedules for the new doctor
          await fetchSchedules(savedDoctorData.id);
          setTimeout(() => setStateField('showNotif', false), 4000);
        } else {
          throw new Error(response.data.message || 'Gagal menyimpan data dokter.');
        }
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err.response?.data?.message || err.message || 'Terjadi kesalahan saat menyimpan data dokter.',
        success: '',
        loadingSave: false,
      }));
    }
  }, [editDoctor, scheduleList, fetchDoctors, fetchSchedules]);

  const handleDelete = useCallback(async () => {
    if (!selectedDoctor) return;
    setState((prev) => ({ ...prev, loadingDelete: true, error: '', success: '' }));
    try {
      const response = await axios.delete(
        `${config.apiUrl}/master/doctors/${selectedDoctor.id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (response.data.status === 'success') {
        setState((prev) => ({
          ...prev,
          success: 'Data dokter berhasil dihapus',
          selectedDoctor: null,
          editDoctor: null,
          scheduleList: [],
        }));
        await fetchDoctors();
      } else {
        setStateField('error', response.data.message || 'Gagal menghapus data dokter');
      }
    } catch {
      setStateField('error', 'Gagal menghapus data dokter');
    } finally {
      setStateField('loadingDelete', false);
    }
  }, [selectedDoctor, fetchDoctors]);

  const handleCancelEdit = useCallback(() => {
    if (selectedDoctor) {
    setState((prev) => ({
      ...prev,
      error: '',
      success: '',
        editDoctor: { ...selectedDoctor },
      isEditing: false,
        scheduleList: prev.scheduleList.map(slot => ({
          ...slot,
          temp_id: slot.id || uuidv4()
        }))
    }));
      fetchSchedules(selectedDoctor.id);
    } else {
      setState((prev) => ({
        ...prev,
        error: '',
        success: '',
        editDoctor: null,
        isEditing: false,
        scheduleList: []
      }));
    }
  }, [selectedDoctor, fetchSchedules]);

  const filteredDoctors = () => {
    let result = [...doctors];
    if (doctorSearchTerm) {
      const searchTermLower = doctorSearchTerm.toLowerCase();
      result = result.filter(
        (doc) =>
          doc.name.toLowerCase().includes(searchTermLower) ||
          (doc.specialization && doc.specialization.toLowerCase().includes(searchTermLower)) ||
          (doc.email && doc.email.toLowerCase().includes(searchTermLower))
      );
    }
    if (filter === 'active') {
      return result.filter((doc) => doc.status === 'Active');
    } else if (filter === 'inactive') {
      return result.filter((doc) => doc.status === 'Inactive');
    }
    return result;
  };

  const getNextSchedule = (doctorId) => {
    const schedules = scheduleList;
    if (schedules.length > 0 && selectedDoctor?.id === doctorId) {
      const upcoming = schedules.find((s) => s.doctor_id === doctorId && s.start_time);
      if (upcoming?.day_of_week && upcoming.start_time) {
        return `${upcoming.day_of_week.substring(0, 3)}, ${upcoming.start_time.substring(0, 5)}`;
      }
    }
    return 'Belum ada jadwal';
  };

  const getDoctorScheduleStatus = (doctorId) => {
    // Selalu cek dari data dokter yang sudah ada schedule
    const doctor = doctors.find(d => d.id === doctorId);
    if (doctor && doctor.schedule && Array.isArray(doctor.schedule)) {
      const hasAnySchedule = doctor.schedule.some(s => s.start_time && s.end_time);
      return hasAnySchedule ? null : 'Belum ada jadwal';
    }
    return 'Belum ada jadwal';
  };

  const renderDoctorDetailsOrForm = () => {
    const doctorToDisplay = isEditing ? editDoctor : selectedDoctor;

        return (
      <>
        {/* Fixed Header Section with Glass Effect */}
        <div className="p-6 md:p-8 border-b border-gray-200 space-y-6 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          {/* Error and Success Messages with Enhanced Design */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-4 rounded-lg flex items-start gap-3 shadow-sm animate-fade-in">
              <AlertTriangle size={24} className="text-red-600 flex-shrink-0 mt-0.5" /> 
              <div>
                <p className="font-semibold text-lg">Gagal!</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-4 rounded-lg flex items-start gap-3 shadow-sm animate-fade-in">
              <CheckCircle size={24} className="text-green-600 flex-shrink-0 mt-0.5" /> 
              <div>
                <p className="font-semibold text-lg">Sukses!</p>
                <p className="text-sm mt-1">{success}</p>
              </div>
            </div>
          )}

          {/* Enhanced Header with Better Visual Hierarchy */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-grow">
              <div className="flex items-center gap-3 mb-2">
                {isEditing && !selectedDoctor ? (
                  <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center">
                    <Plus size={28} className="text-sky-600" />
                  </div>
                ) : isEditing ? (
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Edit3 size={28} className="text-amber-600" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <Stethoscope size={28} className="text-indigo-600" />
                  </div>
                )}
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {isEditing && !selectedDoctor ? 'Tambah Dokter Baru' : isEditing ? 'Edit Detail Dokter' : 'Detail Dokter'}
              </h3>
              <p className="text-gray-500 mt-1 text-sm">
                {isEditing && !selectedDoctor
                  ? 'Isi formulir di bawah ini untuk menambahkan dokter baru ke sistem.'
                  : isEditing
                  ? `Ubah informasi untuk dokter ${selectedDoctor?.name || ''}. Pastikan data akurat.`
                  : `Lihat informasi lengkap dan jadwal praktik untuk dokter ${selectedDoctor?.name || ''}.`}
              </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 mt-4 sm:mt-0">
              {!isEditing && selectedDoctor && (
                <button
                  onClick={() => setStateField('isEditing', true)}
                  aria-label="Edit dokter"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 text-sm hover:scale-105"
                >
                  <Edit3 size={18} className="transition-transform duration-300 group-hover:rotate-12" /> 
                  <span>Edit Data</span>
                </button>
              )}
              {isEditing && (
                <>
                  <button
                    onClick={handleSave}
                    disabled={loadingSave}
                    aria-label="Simpan perubahan dokter"
                    className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed hover:scale-105"
                  >
                    {loadingSave ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} className="transition-transform duration-300 group-hover:scale-110" />
                    )}
                    <span>{loadingSave ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={loadingSave}
                    aria-label="Batalkan pengeditan"
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:shadow transition-all duration-300 flex items-center gap-2 text-sm border border-gray-300 disabled:opacity-70 disabled:cursor-not-allowed hover:scale-105"
                  >
                    <XCircle size={18} className="transition-transform duration-300 group-hover:scale-110" /> 
                    <span>Batal</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content Section with Enhanced Layout */}
        <div className="flex-grow overflow-y-auto p-6 md:p-8 space-y-8 animate-fade-in">
          {/* Form and Schedule Area with Card Layout */}
          <div className="space-y-8">
            {/* Doctor Info Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-6 md:p-8">
            <DoctorInfoForm
              doctor={doctorToDisplay || { name: '', license_no: '', specialization: '', phone_number: '', email: '', status: 'Active', poli: '', is_active: true }}
              isEditing={isEditing}
              onChange={handleInputChange}
              polyclinics={polyclinics}
              doctors={doctors}
            />
              </div>
            </div>

            {/* Schedule Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-6 md:p-8">
            <DoctorSchedule 
              scheduleList={scheduleList}
              isEditing={isEditing}
              onScheduleListChange={handleScheduleListChange}
            />
              </div>
            </div>
          </div>

          {/* Delete Button Area with Enhanced Design */}
          {isEditing && selectedDoctor && (
            <div className="pt-6 border-t border-gray-200 mt-6 flex justify-end">
              <button
                onClick={handleDelete}
                disabled={loadingDelete}
                aria-label="Hapus dokter ini"
                className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed hover:scale-105"
              >
                {loadingDelete ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Trash2 size={18} className="transition-transform duration-300 group-hover:scale-110" />
                )}
                <span>{loadingDelete ? 'Menghapus...' : 'Hapus Dokter Ini'}</span>
              </button>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <PageTemplate>
      <style>
        {`
          @keyframes customFadeInUp {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-custom-fade-in-up {
            animation-name: customFadeInUp;
            animation-duration: 0.4s;
            animation-fill-mode: forwards;
            animation-timing-function: ease-out;
            opacity: 0; /* Start transparent before animation kicks in with delay */
          }
        `}
      </style>
      {/* Header ala resep-obat.jsx */}
      <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 rounded-2xl shadow-xl p-6 mb-8 border border-blue-100/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in backdrop-blur-sm">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
              <Stethoscope className="text-white" size={24} />
            </div>
            Manajemen Dokter
          </h1>
          <p className="mt-2 text-gray-600 font-medium">Kelola data dokter, jadwal praktik, dan informasi penting lainnya.</p>
        </div>
        <button
          onClick={() => {
            setState((prev) => ({
              ...prev,
              selectedDoctor: null,
              editDoctor: {
                name: '',
                license_no: '',
                specialization: '',
                phone_number: '',
                email: '',
                status: 'Active',
                poli: '',
              },
              scheduleList: [],
              removedScheduleIds: [],
              error: '',
              success: '',
              isEditing: true,
            }));
          }}
          className="bg-white/90 hover:bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 text-lg border border-blue-200 hover:scale-105 hover:border-blue-300"
          aria-label="Tambah dokter baru"
        >
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Plus size={16} className="text-white" />
          </div>
          <span className="transition-all duration-300">Tambah Dokter Baru</span>
        </button>
      </div>

      <div className="flex flex-row gap-4 lg:gap-6 min-h-[calc(100vh-180px)]">
        {/* Doctor List Sidebar - More Compact for Tablet */}
        <div className="w-2/5 lg:w-1/3 bg-white/80 rounded-2xl shadow-lg border border-gray-200 flex flex-col max-h-[calc(100vh-180px)] animate-slide-in">
          <div className="p-4 lg:p-6 border-b border-gray-100">
            <h3 className="text-lg lg:text-xl font-bold text-sky-700 flex items-center gap-2">
              <Users size={20} className="text-sky-500" />
              Daftar Dokter
            </h3>
            <div className="relative mt-3 lg:mt-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Cari dokter..."
                className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-sm transition-colors duration-200 bg-gray-50 hover:bg-gray-100"
                value={doctorSearchTerm}
                onChange={(e) => setStateField('doctorSearchTerm', e.target.value)}
                aria-label="Cari dokter"
              />
            </div>
            <div className="flex space-x-1 lg:space-x-2 mt-3 lg:mt-4 bg-gray-100 p-1 rounded-lg">
              {['all', 'active', 'inactive'].map((f) => (
                <button
                  key={f}
                  className={`flex-1 py-1.5 lg:py-2 px-2 lg:px-3 rounded-lg text-xs lg:text-sm font-medium transition-all duration-200 flex items-center justify-center ${
                    filter === f
                      ? `bg-white shadow-md ${
                          f === 'all' ? 'text-blue-600' : f === 'active' ? 'text-green-600' : 'text-red-600'
                        }`
                      : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                  }`}
                  onClick={() => setStateField('filter', f)}
                  aria-label={`Filter dokter ${f === 'all' ? 'semua' : f === 'active' ? 'aktif' : 'non-aktif'}`}
                >
                  {f === 'all' && <Filter size={14} className="mr-1" />}
                  {f === 'active' && <CheckCircle size={14} className="mr-1" />}
                  {f === 'inactive' && <XCircle size={14} className="mr-1" />}
                  <span className="hidden sm:inline">{f === 'all' ? 'Semua' : f === 'active' ? 'Aktif' : 'Non-Aktif'}</span>
                  <span
                    className={`ml-1 text-xs px-1 py-0.5 rounded-full ${
                      f === 'all' ? 'bg-blue-100 text-blue-800' : f === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {f === 'all' ? doctors.length : doctors.filter((d) => (f === 'active' ? d.status === 'Active' : d.status === 'Inactive')).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto flex-grow max-h-[calc(100vh-280px)] p-2">
            {loadingFetch ? (
              <div className="flex flex-col items-center justify-center text-center py-8 text-gray-500">
                <div className="relative">
                  <div className="w-10 h-10 border-4 border-t-white border-white/30 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Users size={16} className="text-blue-600" />
                  </div>
                </div>
                <span className="mt-3 text-sm font-medium text-gray-600">Memuat daftar dokter...</span>
              </div>
            ) : filteredDoctors().length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-8 px-4">
                <Users size={40} className="text-gray-400 mb-3" />
                <h4 className="text-base lg:text-lg font-semibold text-gray-700 mb-1">
                  {filter === 'all' ? 'Belum Ada Dokter' : filter === 'active' ? 'Tidak Ada Dokter Aktif' : 'Tidak Ada Dokter Non-Aktif'}
                </h4>
                <p className="text-xs lg:text-sm text-gray-500">
                  {filter === 'all'
                    ? 'Saat ini belum ada data dokter di sistem.'
                    : `Tidak ada dokter yang cocok dengan filter "${filter === 'active' ? 'Aktif' : 'Non-Aktif'}" saat ini.`}
                </p>
                {filter !== 'all' && (
                  <button
                    onClick={() => setStateField('filter', 'all')}
                    className="mt-3 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                    aria-label="Lihat semua dokter"
                  >
                    Lihat Semua Dokter
                  </button>
                )}
              </div>
            ) : (
              filteredDoctors().map((doc, index) => (
                <div
                  key={doc.id}
                  className={`animate-custom-fade-in-up cursor-pointer transition-all duration-300 ease-out rounded-lg mx-1 mb-2 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-1 px-3 py-2.5 border-l-4 ${
                    selectedDoctor?.id === doc.id 
                      ? 'bg-gradient-to-r from-sky-50 to-white border-sky-500 shadow-lg transform scale-[1.02]' 
                      : 'bg-white hover:bg-gray-50 border-transparent hover:border-sky-300 hover:shadow-md'
                  }`}
                  onClick={() => handleSelectDoctor(doc)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSelectDoctor(doc)}
                  role="button"
                  tabIndex={0}
                  style={{ animationDelay: `${index * 0.05}s` }}
                  aria-label={`Pilih dokter ${doc.name}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        className={`flex-shrink-0 w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-white text-xs lg:text-sm font-medium shadow-md transition-transform duration-300 hover:scale-110 ${
                          doc.status === 'Active' 
                            ? 'bg-gradient-to-br from-sky-500 to-indigo-600' 
                            : 'bg-gradient-to-br from-slate-400 to-slate-600'
                        }`}
                      >
                        {doc.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`text-sm font-semibold truncate transition-colors duration-300 ${
                          selectedDoctor?.id === doc.id ? 'text-sky-800 font-bold' : 'text-gray-700 hover:text-sky-700'
                        }`}>
                          {doc.name}
                        </div>
                        <div className={`flex items-center text-xs mt-0.5 transition-colors duration-300 ${
                          selectedDoctor?.id === doc.id ? 'text-sky-600' : 'text-gray-500 hover:text-gray-700'
                        }`}>
                          <Shield size={14} className={`mr-1 shrink-0 transition-colors duration-300 ${
                            doc.status === 'Active' ? 'text-emerald-500' : 'text-rose-500'
                          }`} />
                          <span className="truncate">{doc.specialization || 'N/A'}</span>
                        </div>
                        <div className={`flex items-center text-xs mt-0.5 text-gray-400 ${
                          selectedDoctor?.id === doc.id ? 'text-sky-600' : 'text-gray-500 hover:text-gray-700'
                        }`}>
                          <Award size={12} className="mr-1" />
                          <span className="truncate">{doc.license_no || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0 ml-2">
                      <div
                        className={`text-xs px-2 py-0.5 rounded-full font-medium transition-all duration-300 ${
                          doc.status === 'Active' 
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                            : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                        }`}
                      >
                        {doc.status === 'Active' ? 'Aktif' : 'Non-Aktif'}
                      </div>
                      {getDoctorScheduleStatus(doc.id) && (
                        <div className={`flex items-center text-xs mt-1.5 transition-colors duration-300 ${
                          selectedDoctor?.id === doc.id ? 'text-sky-600' : 'text-gray-500 hover:text-gray-700'
                        }`}>
                          <Clock size={14} className={`mr-1 transition-colors duration-300 ${
                            selectedDoctor?.id === doc.id ? 'text-sky-600' : 'text-gray-400 group-hover:text-gray-600'
                          }`} />
                          <span className="text-xs">{getDoctorScheduleStatus(doc.id)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Doctor Details/Form Area */}
        <div className="w-3/5 lg:w-2/3 bg-white/90 rounded-2xl shadow-lg border border-gray-200 flex flex-col max-h-[calc(100vh-180px)] animate-fade-in">
          {editDoctor && (isEditing || selectedDoctor) ? (
            renderDoctorDetailsOrForm()
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-10 bg-gradient-to-b from-sky-50 to-white rounded-2xl shadow-inner animate-fade-in">
              <Users size={80} className="mb-6 text-gray-300 animate-pulse" />
              <h3 className="text-3xl font-bold text-sky-700 mb-3">Manajemen Dokter</h3>
              <p className="max-w-lg text-gray-600 text-lg">
                Mulai dengan memilih dokter dari daftar atau tambahkan dokter baru untuk mengelola jadwal dan informasi.
              </p>
              <button
                onClick={() => {
                  setState((prev) => ({
                    ...prev,
                    selectedDoctor: null,
                    editDoctor: {
                      name: '',
                      license_no: '',
                      specialization: '',
                      phone_number: '',
                      email: '',
                      status: 'Active',
                      poli: '',
                    },
                    scheduleList: [],
                    removedScheduleIds: [],
                    error: '',
                    success: '',
                    isEditing: true,
                  }));
                }}
                className="mt-6 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-lg"
                aria-label="Tambah dokter baru"
              >
                <Plus size={24} className="mr-2" /> Tambah Dokter Baru
              </button>
            </div>
          )}
        </div>
      </div>
      {showNotif && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in ${notifType === 'success' ? 'bg-green-100 border border-green-300 text-green-800' : 'bg-red-100 border border-red-300 text-red-800'}`}>
          {notifType === 'success' ? <CheckCircle size={24} className="text-green-600" /> : <XCircle size={24} className="text-red-600" />}
          <span className="font-semibold">{notifMessage}</span>
        </div>
      )}
    </PageTemplate>
  );
};

export default Dokter;