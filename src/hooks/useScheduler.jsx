import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useScheduler = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAvailableSlots = async (dateString) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-availability', {
        body: { date: dateString }
      });

      if (error) throw error;
      return data.slots; // Ya vienen filtrados (Google + DB + Horarios)

    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const registerPatient = async (data) => {
    return await supabase.rpc('get_or_create_patient', {
      p_full_name: data.name,
      p_email: data.email,
      p_phone: data.phone
    });
  };

  return { getAvailableSlots, registerPatient, loading, error };
};