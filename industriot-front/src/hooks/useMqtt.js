import { useEffect, useState, useRef } from 'react';
import mqtt from 'mqtt';

const BROKER_URL = 'wss://cbb2c9e8a6774389b0b16d7287862246.s1.eu.hivemq.cloud:8884/mqtt';

export function useMqtt() {
  const [connected, setConnected]   = useState(false);
  const [mesures, setMesures]       = useState({});
  const clientRef                   = useRef(null);

  useEffect(() => {
    const client = mqtt.connect(BROKER_URL, {
    clientId:       'react-dashboard-' + Math.random().toString(16).slice(2),
    reconnectPeriod: 3000,
    username:       'rimaa',
    password:       'Rim01082004',
    protocol:       'wss',
  });

    client.on('connect', () => {
      console.log('✅ MQTT connecté');
      setConnected(true);
      // S'abonner à toutes les machines
      client.subscribe('usine/#');
    });

    client.on('message', (topic, payload) => {
      // Ignorer les topics d'état global
      if (topic.endsWith('/etat')) return;

      try {
        const data = JSON.parse(payload.toString());
        if (!data.machine_id || !data.type) return;

        setMesures(prev => ({
          ...prev,
          [data.machine_id]: {
            ...prev[data.machine_id],
            [data.type]: {
              valeur:     data.valeur,
              unite:      data.unite,
              hors_seuil: data.hors_seuil,
              timestamp:  data.timestamp,
            }
          }
        }));
      } catch (e) {
        console.warn('Message MQTT invalide:', e);
      }
    });

    client.on('disconnect', () => setConnected(false));
    client.on('error', (err) => console.error('MQTT erreur:', err));

    clientRef.current = client;

    return () => {
      client.end();
    };
  }, []);

  return { connected, mesures };
}