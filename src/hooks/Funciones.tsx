import { database, get, ref, collection, getDocs, db, doc, onSnapshot, setDoc } from "@/services/Firebase";
import { useQuery} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Variable, HistoricoDato, ObtenerAvisos } from "@/services/Datos";
import { query, orderBy, limit} from "firebase/firestore";


////////////////  REAL TIME DE FIREBASE //////////////// 

export async function ObtenerVariables(): Promise<Variable | null> {

  const snapshot = await get(ref(database, "/"));

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val();
}

export function useVariables() {

  const query = useQuery({
    queryKey: ["Variables"],
    queryFn: ObtenerVariables,
    refetchInterval: 5000,
  });

  return {
    Variables: query.data,
  };
}



//////////////// BASE DE DATOS Firestore ////////////////


export function useColeccion<T>(
  nombreColeccion: string
) {

  const [datos, setDatos] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {

    const unsubscribe = onSnapshot(

      collection(db, nombreColeccion),

      (snapshot) => {

        const nuevosDatos: T[] = [];

        snapshot.forEach((doc) => {

          nuevosDatos.push({
            ...doc.data(),
            Tiempo: Number(doc.id),
          } as T);

        });

        nuevosDatos.sort(
          (a: any, b: any) => a.Tiempo - b.Tiempo
        );

        setDatos(nuevosDatos);

        setLoading(false);
      },

      (err) => {

        console.error(err);

        setError(err);

        setLoading(false);
      }

    );

    return () => unsubscribe();

  }, [nombreColeccion]);

  return {
    datos,
    loading,
    error,
  };
}

export function useAvisos() {

  const query = useQuery({
    queryKey: ["Avisos"],
    queryFn: ObtenerAvisos,
    refetchInterval: 5000,
  });

  return {
    Avisos: query.data,
  };

}