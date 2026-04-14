import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://kzrfxoxiizedyaacngto.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cmZ4b3hpaXplZHlhYWNuZ3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MzU0ODUsImV4cCI6MjA5MTExMTQ4NX0.gxSeJjwg2HD8uA9ifyw47EYiMUfhy0F-rCIH9aMvpUQ');

async function testDB() {
  console.log("Iniciando prueba de conexión...");
  try {
    const { data, error } = await supabase.from('cursos').select('*').limit(1);
    if (error) throw error;
    console.log('✅ Conexión DB Exitosa. Datos obtenidos:', data);
  } catch (e) {
    console.error('❌ Error DB:', e.message);
  }
}

function testRealtime() {
  console.log("Iniciando prueba de Realtime...");
  const channel = supabase.channel('test-channel');
  
  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'cursos' }, (payload) => {
    console.log('✅ Cambio Realtime detectado:', payload);
  });

  channel.subscribe((status) => {
    console.log('Status Realtime:', status);
    if (status === 'SUBSCRIBED') {
      console.log('✅ Realtime conectado exitosamente');
      setTimeout(() => process.exit(0), 2000);
    }
  });
}

testDB().then(testRealtime);
