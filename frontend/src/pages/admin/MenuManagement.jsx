import React, { useEffect, useState } from 'react';
import axios from 'axios';
import config from '../../config';
import { Menu as MenuIcon, Plus, Edit2, Trash2, X, ChevronDown, ChevronRight, Search, Check, Loader2, FolderOpen, FolderClosed, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { useSortable, SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const ICON_MAP = {
  'home': <MenuIcon size={18} />, 'database': <MenuIcon size={18} />, 'rm': <MenuIcon size={18} />, 'user-plus': <MenuIcon size={18} />,
  'credit-card': <MenuIcon size={18} />, 'users': <MenuIcon size={18} />, 'chart-bar': <MenuIcon size={18} />, 'settings': <MenuIcon size={18} />,
  'capsule': <MenuIcon size={18} />, 'user': <MenuIcon size={18} />, 'stethoscope': <MenuIcon size={18} />, 'pill': <MenuIcon size={18} />,
  'clipboard-list': <MenuIcon size={18} />, 'building-2': <MenuIcon size={18} />, 'history': <MenuIcon size={18} />, 'activity': <MenuIcon size={18} />,
  'bed-double': <MenuIcon size={18} />, 'file-plus': <MenuIcon size={18} />, 'file-text': <MenuIcon size={18} />, 'receipt': <MenuIcon size={18} />,
  'file-medical': <MenuIcon size={18} />, 'timer': <MenuIcon size={18} />, 'bar-chart': <MenuIcon size={18} />, 'shield': <MenuIcon size={18} />,
  'layout': <MenuIcon size={18} />, 'package': <MenuIcon size={18} />, 'boxes': <MenuIcon size={18} />
};

const EditableCell = ({ value, onChange, placeholder }) => {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  useEffect(() => { setLocalValue(value); }, [value]);
  return editing ? (
    <input
      className="bg-blue-50 border-0 border-b-2 border-blue-400 focus:border-blue-500 px-2 py-1 text-sm w-full outline-none transition-all font-medium text-gray-800 rounded-sm"
      value={localValue}
      autoFocus
      onChange={e => setLocalValue(e.target.value)}
      onBlur={() => { setEditing(false); onChange(localValue); }}
      onKeyDown={e => { if (e.key === 'Enter') { setEditing(false); onChange(localValue); } }}
      placeholder={placeholder}
    />
  ) : (
    <span className="block px-2 py-1 min-h-[30px] cursor-pointer hover:bg-gray-100 rounded-md text-gray-700 font-medium transition-all flex items-center text-sm" onClick={() => setEditing(true)}>
      {value || <span className="text-gray-400 italic">{placeholder}</span>}
    </span>
  );
};

function SortableMenuRow({ menu, onEdit, onAddSub, style, isDragging, isOver, expandedMenus, onToggleExpand, allMenus, dropPosition, ...props }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: dndDragging } = useSortable({ id: menu.id });
  
  // Check if menu has children by looking for other menus with this menu as parent
  // Use original menu data, not flattened data
  const hasChildren = allMenus.some(m => m.parent_id === menu.id);
  const isExpanded = expandedMenus.includes(menu.id);
  
  return (
    <motion.div
      ref={setNodeRef}
      style={{
        ...style,
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: dndDragging ? 0.5 : 1,
        zIndex: dndDragging ? 50 : 1,
        boxShadow: dndDragging ? '0 4px 16px 0 rgba(37, 99, 235, 0.15)' : '',
        background: dndDragging ? 'rgba(239, 246, 255, 0.95)' : '',
      }}
      className={`flex items-center gap-3 py-2 px-3 rounded-lg group shadow-sm mb-2 bg-white border border-transparent hover:border-gray-200 hover:shadow-md transition-all duration-200 ${dndDragging ? 'ring-2 ring-blue-300 scale-102' : ''} ${isOver ? 'bg-blue-50/50' : ''}`}
      whileHover={{ scale: dndDragging ? 1.02 : 1.01 }}
      {...props}
    >
      {/* Drop preview overlay */}
      {isOver && dropPosition === 'above' && (
        <div className="absolute inset-0 bg-blue-100/50 border-2 border-blue-400 rounded-2xl -z-10" />
      )}
      {isOver && dropPosition === 'below' && (
        <div className="absolute inset-0 bg-blue-100/50 border-2 border-blue-400 rounded-2xl -z-10" />
      )}
      
      <span 
        className="cursor-grab text-blue-500 select-none mr-1 hover:text-blue-600 transition-all p-2 rounded-lg hover:bg-blue-50 active:bg-blue-100 active:scale-95 font-bold text-lg"
        {...attributes}
        {...listeners}
        title="Drag untuk memindahkan menu"
      >
        ⋮⋮
      </span>
      {hasChildren && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleExpand(menu.id); }}
          className="mr-1 p-2 text-blue-600 hover:bg-blue-100 rounded-xl transition-all duration-200 hover:scale-110 border-2 border-blue-200 hover:border-blue-400 bg-blue-50 relative"
          title={isExpanded ? "Collapse sub-menu" : "Expand sub-menu"}
        >
          {isExpanded ? <FolderOpen size={18} /> : <FolderClosed size={18} />}
          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {allMenus.filter(m => m.parent_id === menu.id).length}
          </span>
        </button>
      )}
      {!hasChildren && menu.level === 0 && (
        <div className="mr-1 w-8 h-8 flex items-center justify-center">
          <span className="text-gray-300 text-xs">•</span>
        </div>
      )}
      <div className="mr-3 p-2 bg-blue-50 rounded-xl">
        <span className="text-blue-600">{ICON_MAP[menu.icon] || <MenuIcon size={18} />}</span>
      </div>
      <div style={{ paddingLeft: menu.level * 24 }} className="flex-1 flex gap-4 items-center">
        <div className="w-1/3">
          <EditableCell value={menu.menu_name} onChange={v => onEdit(menu.id, 'menu_name', v)} placeholder="Nama Menu" />
        </div>
        <div className="w-1/3">
          <EditableCell value={menu.menu_path} onChange={v => onEdit(menu.id, 'menu_path', v)} placeholder="Path" />
        </div>
        <div className="w-48">
          <EditableCell value={menu.icon} onChange={v => onEdit(menu.id, 'icon', v)} placeholder="Icon" />
        </div>
      </div>
      <div className="flex gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-all duration-200">
        <button 
          onClick={() => onAddSub(menu.id)} 
          className="p-2 text-green-600 hover:bg-green-100 rounded-xl transition-all hover:scale-110" 
          title="Tambah Sub-menu"
        >
          <Plus size={18} />
        </button>
      </div>
    </motion.div>
  );
}

// Helper: build tree from flat array
const buildTree = (items, parentId = null) => {
  return items
    .filter(item => item.parent_id === parentId)
    .sort((a, b) => (a.order_number || 0) - (b.order_number || 0))
    .map(item => ({
      ...item,
      children: buildTree(items, item.id)
    }));
};

// Helper: flatten tree to array with expanded filter
const flattenTree = (tree, parentId = null, level = 0, expandedMenus = []) => {
  let result = [];
  tree.forEach((item, idx) => {
    result.push({ ...item, parent_id: parentId, level });
    if (item.children && item.children.length > 0 && expandedMenus.includes(item.id)) {
      result = result.concat(flattenTree(item.children, item.id, level + 1, expandedMenus));
    }
  });
  return result;
};

const MenuManagement = () => {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState({ show: false, type: '', message: '' });
  const [localMenus, setLocalMenus] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor));
  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [dropPosition, setDropPosition] = useState(null);
  const [expandedMenus, setExpandedMenus] = useState([]);

  useEffect(() => { fetchMenus(); }, []);
  useEffect(() => { setLocalMenus(menus); setHasChanges(false); }, [menus]);

  const handleAddNewRootMenu = () => {
    const newId = 'new-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const newMenu = {
      id: newId,
      menu_name: '',
      menu_path: '',
      icon: '',
      parent_id: null,
      order_number: localMenus.filter(m => !m.parent_id).length + 1,
    };
    setLocalMenus(menus => [...menus, newMenu]);
    setHasChanges(true);
  };

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${config.apiUrl}/menus`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Fetched menus:', res.data.data);
      setMenus(res.data.data);
    } catch (err) {
      console.error('Error fetching menus:', err);
      setNotif({ show: true, type: 'error', message: 'Gagal mengambil data menu' });
    }
    setLoading(false);
  };

  // Toggle expand/collapse
  const handleToggleExpand = (menuId) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  // Drag & drop tree logic with expanded filter
  const tree = buildTree(localMenus);
  const flatMenus = flattenTree(tree, null, 0, expandedMenus);
  const ids = flatMenus.map(m => m.id);

  // Debug: log menus with children
  useEffect(() => {
    if (localMenus.length > 0) {
      const menusWithChildren = localMenus.filter(menu => 
        localMenus.some(m => m.parent_id === menu.id)
      );
      console.log('Menus with children:', menusWithChildren);
      console.log('Total menus:', localMenus.length);
      console.log('Expanded menus:', expandedMenus);
    }
  }, [localMenus, expandedMenus]);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { over, activatorEvent } = event;
    setOverId(over?.id || null);
    
    if (over) {
      const targetRect = over.rect;
      const mouseY = activatorEvent.clientY;
      const targetCenterY = targetRect.top + targetRect.height / 2;
      setDropPosition(mouseY < targetCenterY ? 'above' : 'below');
    } else {
      setDropPosition(null);
    }
  };

  const handleDragEnd = (event) => {
    setActiveId(null);
    setOverId(null);
    setDropPosition(null);
    
    const { active, over, activatorEvent } = event;
    if (!over || active.id === over.id) return;
    
    const oldIndex = flatMenus.findIndex(m => m.id === active.id);
    const targetIndex = flatMenus.findIndex(m => m.id === over.id);
    
    if (oldIndex === targetIndex) return;
    
    // Calculate final position based on mouse position
    const targetRect = over.rect;
    const mouseY = activatorEvent.clientY;
    const targetCenterY = targetRect.top + targetRect.height / 2;
    const insertAfter = mouseY > targetCenterY;
    
    // Calculate new index based on insertAfter
    let newIndex;
    if (insertAfter) {
      newIndex = targetIndex + 1;
    } else {
      newIndex = targetIndex;
    }
    
    // Handle edge cases
    if (oldIndex < newIndex) {
      newIndex -= 1; // Adjust for removal of item
    }
    
    if (oldIndex !== newIndex) {
      // Use arrayMove for accurate positioning
      const newFlatMenus = arrayMove(flatMenus, oldIndex, newIndex);
      
      // Convert back to original structure
      const newMenus = [...localMenus];
      const draggedItem = newMenus.find(m => m.id === active.id);
      
      if (draggedItem) {
        // Remove from original position
        const originalIndex = newMenus.findIndex(m => m.id === active.id);
        newMenus.splice(originalIndex, 1);
        
        // Find target in original array
        const targetOriginalIndex = newMenus.findIndex(m => m.id === over.id);
        
        // Insert at correct position
        const insertIndex = insertAfter ? targetOriginalIndex + 1 : targetOriginalIndex;
        newMenus.splice(insertIndex, 0, draggedItem);
        
        // Rebuild order_number
        const updatedMenus = newMenus.map((m, i) => ({ ...m, order_number: i + 1 }));
        setLocalMenus(updatedMenus);
        setHasChanges(true);
      }
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
    setDropPosition(null);
  };

  // Inline edit logic
  const handleInlineEdit = (id, field, value) => {
    setLocalMenus(menus => menus.map(m => m.id === id ? { ...m, [field]: value } : m));
    setHasChanges(true);
  };

  // Add sub-menu
  const handleAddSub = (parentId) => {
    const newId = 'new-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const newMenu = {
      id: newId,
      menu_name: '',
      menu_path: '',
      icon: '',
      parent_id: parentId,
      order_number: localMenus.length + 1
    };
    
    setLocalMenus(menus => [...menus, newMenu]);
    setHasChanges(true);
    
    // Auto expand parent when adding sub-menu
    if (!expandedMenus.includes(parentId)) {
      setExpandedMenus(prev => [...prev, parentId]);
    }
  };

  // Save all changes
  const handleSaveAll = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Filter dan validasi data sebelum dikirim
      const validMenus = localMenus.filter(menu => {
        // Pastikan ID valid (bukan string kosong atau null)
        if (!menu.id || menu.id === '') {
          console.warn('Menu dengan ID invalid:', menu);
          return false;
        }
        
        // Pastikan ID bukan 'batch' (yang bisa menyebabkan error)
        if (menu.id === 'batch') {
          console.warn('Menu dengan ID "batch" tidak valid:', menu);
          return false;
        }
        
        return true;
      }).map(menu => ({
        ...menu,
        // Pastikan nilai yang dikirim valid
        menu_name: menu.menu_name || '',
        menu_path: menu.menu_path || '',
        icon: menu.icon || '',
        parent_id: menu.parent_id || null,
        order_number: menu.order_number || 0
      }));

      if (validMenus.length === 0) {
        setNotif({ show: true, type: 'error', message: 'Tidak ada data menu yang valid untuk disimpan' });
        return;
      }

      console.log('Sending menus to server:', validMenus);
      
      const response = await axios.put(`${config.apiUrl}/menus/batch`, { 
        menus: validMenus 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        setNotif({ show: true, type: 'success', message: response.data.message || 'Perubahan menu berhasil disimpan' });
        setHasChanges(false);
        // Refresh data dari server
        await fetchMenus();
      } else {
        setNotif({ show: true, type: 'error', message: response.data.message || 'Gagal menyimpan perubahan menu' });
      }
    } catch (err) {
      console.error('Error saving menus:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Gagal menyimpan perubahan menu';
      setNotif({ show: true, type: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Memuat data menu...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
            <MenuIcon className="text-blue-600" size={32} />
            Manajemen Menu
          </h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Atur struktur dan urutan menu navigasi aplikasi.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAddNewRootMenu}
            className="px-4 py-2 rounded-lg font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 transition-all duration-200 flex items-center gap-2 text-sm shadow-md hover:shadow-lg"
          >
            <Plus size={16} />
            Tambah Parent
          </button>
          <button
            onClick={handleSaveAll}
            disabled={!hasChanges || loading}
            className={`px-6 py-2 rounded-lg font-bold transition-all duration-200 flex items-center gap-2 text-sm shadow-md hover:shadow-lg ${
              hasChanges && !loading 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <Save size={16} />
            )}
            {loading ? 'Menyimpan...' : (hasChanges ? 'Simpan Perubahan' : 'Tersimpan')}
          </button>
        </div>
      </div>
      
      <div className="w-full">
        <AnimatePresence>
          {notif.show && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`mb-4 p-3 rounded-lg flex items-center gap-3 shadow-md border ${notif.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
            >
              {notif.type === 'success' ? <Check size={18} /> : <X size={18} />}
              <span className="font-medium text-sm">{notif.message}</span>
              <button onClick={() => setNotif({ show: false })} className="ml-auto text-lg font-bold hover:opacity-70 transition-opacity">&times;</button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-200/80">
          {flatMenus.length === 0 ? (
            <div className="text-center py-12">
              <MenuIcon size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-1">Belum ada menu</h3>
              <p className="text-gray-500 text-sm">Klik "Tambah Menu" untuk memulai.</p>
            </div>
          ) : (
            <>
              {/* Header for the list */}
              <div className="flex items-center gap-3 py-2 px-4 text-xs font-bold text-gray-500 uppercase border-b-2 border-gray-100 mb-2">
                <div className="w-[128px]"> {/* Spacer for handle, expander, icon */}
                  Menu
                </div>
                <div className="w-1/3">Path</div>
                <div className="w-48">Icon</div>
                <div className="flex-1"></div> {/* Spacer for actions */}
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
              >
                {/* Drop zone for top position */}
                {overId && dropPosition === 'above' && flatMenus.findIndex(m => m.id === overId) === 0 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="h-1.5 bg-blue-500 rounded-full mb-1 mx-4 opacity-90 shadow-lg"
                  />
                )}
                
                <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                  {flatMenus.map((menu, index) => (
                    <div key={menu.id} className="relative">
                      {overId === menu.id && dropPosition === 'above' && index > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="h-1.5 bg-blue-500 rounded-full mb-1 mx-4 opacity-90 shadow-lg"
                        />
                      )}
                      
                      {/* Drop preview for this item */}
                      {overId === menu.id && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`absolute inset-0 rounded-2xl pointer-events-none ${
                            dropPosition === 'above' 
                              ? 'bg-blue-100/30 border-t-4 border-blue-400' 
                              : 'bg-blue-100/30 border-b-4 border-blue-400'
                          }`}
                          style={{ zIndex: -1 }}
                        />
                      )}
                      
                      <SortableMenuRow
                        menu={menu}
                        onEdit={handleInlineEdit}
                        onAddSub={handleAddSub}
                        isDragging={activeId === menu.id}
                        isOver={overId === menu.id}
                        expandedMenus={expandedMenus}
                        onToggleExpand={handleToggleExpand}
                        allMenus={localMenus}
                        dropPosition={dropPosition}
                      />
                      {overId === menu.id && dropPosition === 'below' && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="h-1.5 bg-blue-500 rounded-full mt-1 mx-4 opacity-90 shadow-lg"
                        />
                      )}
                    </div>
                  ))}
                </SortableContext>
                <DragOverlay dropAnimation={{ duration: 250, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
                  {activeId ? (
                    <div className="flex items-center gap-3 py-2 px-3 rounded-lg shadow-2xl bg-white/90 border border-blue-400 ring-2 ring-blue-400/20 backdrop-blur-sm transform rotate-1 scale-105">
                      <span className="cursor-grabbing text-blue-600 select-none mr-1 font-bold text-lg">⋮⋮</span>
                      <div className="mr-2 p-2 bg-blue-100 rounded-lg">
                        <span className="text-blue-700">{ICON_MAP[flatMenus.find(m => m.id === activeId)?.icon] || <MenuIcon size={18} />}</span>
                      </div>
                      <span className="font-bold text-blue-800">{flatMenus.find(m => m.id === activeId)?.menu_name || ''}</span>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuManagement;