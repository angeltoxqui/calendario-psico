import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { ChevronLeft, Plus, DollarSign, Clock, Edit2, Trash2, Power, X } from 'lucide-react';

export default function ServicesPanel() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para saber si estamos editando uno existente o creando uno nuevo
  const [editingId, setEditingId] = useState(null);

  // Formulario único (se usa para crear y para editar)
  const initialFormState = { name: '', description: '', price: '', duration_min: 60 };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setServices(data || []);
    setLoading(false);
  };

  // Manejar inputs del formulario
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Enviar formulario (Crear o Actualizar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        // ACTUALIZAR
        const { error } = await supabase
          .from('services')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        // CREAR NUEVO
        const { error } = await supabase
          .from('services')
          .insert([formData]);
        if (error) throw error;
      }

      // Resetear todo
      setFormData(initialFormState);
      setEditingId(null);
      fetchServices();
      alert(editingId ? 'Servicio actualizado' : 'Servicio creado');

    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // Cargar datos en el formulario para editar
  const startEdit = (service) => {
    setEditingId(service.id);
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price,
      duration_min: service.duration_min
    });
    // Scroll suave hacia arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(initialFormState);
  };

  // Activar / Desactivar (Soft Delete)
  const toggleActive = async (id, currentStatus) => {
    await supabase.from('services').update({ is_active: !currentStatus }).eq('id', id);
    fetchServices();
  };

  // Eliminar (Solo si no tiene citas, si no dará error por llave foránea)
  const handleDelete = async (id) => {
    if (!confirm('¿Seguro que quieres borrarlo permanentemente? Si tiene citas asociadas fallará (mejor desactívalo).')) return;
    
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) alert('No se puede borrar porque ya tiene citas registradas. Mejor usa el botón de "Desactivar".');
    else fetchServices();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Cabecera */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link to="/admin" className="text-gray-500 hover:text-indigo-600 flex items-center mb-2">
              <ChevronLeft size={20} /> Volver al Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">Mis Servicios</h1>
          </div>
        </div>

        {/* TARJETA FORMULARIO */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-indigo-100 mb-10">
          <h2 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
            {editingId ? <Edit2 size={20}/> : <Plus size={20}/>}
            {editingId ? 'Editar Servicio' : 'Agregar Nuevo Servicio'}
          </h2>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Nombre del Servicio</label>
              <input 
                type="text" name="name" required
                value={formData.name} onChange={handleChange}
                placeholder="Ej: Terapia Individual"
                className="w-full p-2 border border-gray-300 rounded-lg mt-1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Precio ($)</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">$</span>
                </div>
                <input 
                  type="number" name="price" required
                  value={formData.price} onChange={handleChange}
                  className="w-full pl-7 p-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Duración (minutos)</label>
              <input 
                type="number" name="duration_min" required
                value={formData.duration_min} onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg mt-1"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Descripción (Opcional)</label>
              <textarea 
                name="description" rows="2"
                value={formData.description} onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg mt-1"
              />
            </div>

            <div className="md:col-span-2 flex gap-2 pt-2">
              <button 
                type="submit" 
                className={`flex-1 text-white font-bold py-2 px-4 rounded-lg transition ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-slate-900 hover:bg-slate-800'}`}
              >
                {editingId ? 'Guardar Cambios' : 'Crear Servicio'}
              </button>
              
              {editingId && (
                <button 
                  type="button" onClick={cancelEdit}
                  className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* LISTA DE SERVICIOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? <p>Cargando catálogo...</p> : services.map((svc) => (
            <div key={svc.id} className={`bg-white p-5 rounded-xl shadow-sm border relative transition-all ${svc.is_active ? 'border-gray-200' : 'border-red-100 bg-red-50 opacity-75'}`}>
              
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-gray-800">{svc.name}</h3>
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(svc)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full" title="Editar">
                    <Edit2 size={18}/>
                  </button>
                  <button onClick={() => toggleActive(svc.id, svc.is_active)} className={`p-2 rounded-full ${svc.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-200'}`} title={svc.is_active ? "Desactivar" : "Activar"}>
                    <Power size={18}/>
                  </button>
                  <button onClick={() => handleDelete(svc.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-full" title="Borrar permanentemente">
                    <Trash2 size={18}/>
                  </button>
                </div>
              </div>

              <div className="flex gap-4 text-sm text-gray-600 mb-3">
                <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                  <DollarSign size={14}/> {svc.price}
                </span>
                <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                  <Clock size={14}/> {svc.duration_min} min
                </span>
              </div>

              <p className="text-gray-500 text-sm">{svc.description || 'Sin descripción'}</p>
              
              {!svc.is_active && (
                <div className="absolute bottom-2 right-4 text-xs font-bold text-red-500 uppercase tracking-wider">
                  Desactivado
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}