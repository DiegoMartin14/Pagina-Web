import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { loadConfig, saveConfig, defaultConfig, SolarConfig, Orientation } from "@/services/Datos";
import { Save, RotateCcw, BatteryCharging, Globe2, Factory, Compass } from "lucide-react";
import { cn } from "@/lib/utils";


const orientations: Orientation[] = ["Norte", "Sur", "Este", "Oeste"];

export default function Configuracion() {
  const [config, setConfig] = useState<SolarConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [locationSelected, setLocationSelected] = useState(false);
  const [estadoGuardado, setEstadoGuardado] = useState< "pendiente" | "guardado" >("guardado");
  const orientacionIncorrecta =
  (config.Latitud !== null &&
      config.Latitud < 0 &&
      config.Orientacion === "Sur") ||

    (config.Latitud !== null &&
      config.Latitud > 0 &&
      config.Orientacion === "Norte");



  useEffect(() => {
    loadConfig().then(setConfig);
  }, []);

  useEffect(() => {
    if (locationSelected) return;

    if (locationSearch.length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      searchLocation(locationSearch);
    }, 800);

    return () => clearTimeout(timer);
  }, [locationSearch, locationSelected]);


  const updateField = (
    key: keyof SolarConfig,
    value: number | string | Orientation | null
  ) => {

    setConfig((c) => ({
      ...c,
      [key]: value,
    }));

    setEstadoGuardado("pendiente");
  };

  const searchLocation = async (query: string) => {
    const cleanQuery = query.trim();

    if (cleanQuery.length < 3) return;

    setIsSearching(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}&limit=5&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "es",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setSearchResults(data);

    } catch (error) {
      console.error("Error buscando ubicación:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLocation = (result: any) => {
    const country = result.address.country || "";

    const city =
      result.address.city ||
      result.address.town ||
      result.address.village ||
      result.address.state ||
      "";

    // Valor absoluto y 1 decimal
    const Latitud = parseFloat(result.lat).toFixed(2);
    const Longitud = parseFloat(result.lon).toFixed(2);

    const newConfig = {
      ...config,
      Pais: country,
      Ciudad: city,
      Latitud,
      Longitud,
    };

    setConfig(newConfig);
    setEstadoGuardado("pendiente");

    setLocationSearch(result.display_name);
    setSearchResults([]);
    setLocationSelected(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveConfig(config);
      setEstadoGuardado("guardado");
      toast.success("Configuración guardada", { description: "Los parámetros se sincronizaron con la nube." });
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const panelFields: {
    key: keyof SolarConfig;
    label: string;
    unit?: string;
    step?: number;
  }[] = [
      { key: "Isc", label: "ICC (corriente de corto)", unit: "A", step: 0.01 },
      { key: "Voc", label: "VCA (tensión circuito abierto)", unit: "V", step: 0.01 },
      { key: "Imp", label: "Corriente máx. potencia (Imp)", unit: "A", step: 0.01 },
      { key: "Vmp", label: "Tensión máx. potencia (Vmp)", unit: "V", step: 0.01 },
      { key: "Ns", label: "Número de celdas", step: 1 },
      { key: "Coef_Temp", label: "Coeficiente De Temperatura (Valor tipico: 0.004)", unit: "ºC", step: 0.01 },
      { key: "Ancho", label: "Ancho del panel", unit: "m", step: 0.01 },
      { key: "Largo", label: "Largo del panel", unit: "m", step: 0.01 },
    ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Configura los parámetros del panel por hoja de datos, características y ubicación de la planta.
        </p>
      </div>

      {/* Panel solar */}
      <SectionPanel icon={BatteryCharging} title="Parámetros del panel solar" description="Características eléctricas del módulo fotovoltaico">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {panelFields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label htmlFor={`panel-${f.key}`} className="text-xs text-muted-foreground">
                {f.label} {f.unit && <span className="text-muted-foreground/70">({f.unit})</span>}
              </Label>
              <Input
                id={`panel-${f.key}`}
                type="number"
                step={f.step}
                value={config[f.key] ?? ""}
                onChange={(e) =>
                  updateField(
                    f.key,
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
                className="bg-background"
              />
            </div>
          ))}
        </div>
      </SectionPanel>


      {/* Ubicación */}
      <SectionPanel
        icon={Globe2}
        title="Ubicación"
        description="Busca la ubicación de la instalación"
      >
        <div className="space-y-4">

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Buscar ciudad o país
            </Label>

            <Input
              placeholder="Ej: Concepción del Uruguay, Argentina"
              value={locationSearch}
              onChange={(e) => {
                setLocationSelected(false);
                setLocationSearch(e.target.value);
              }}
              className="bg-background"
            />
          </div>

          {searchResults.length > 0 && (
            <div className="rounded-md border bg-background p-2 space-y-1">
              {searchResults.map((result) => (
                <button
                  key={result.place_id}
                  onClick={() => handleSelectLocation(result)}
                  className="w-full text-left p-2 rounded hover:bg-muted text-sm"
                >
                  {result.display_name}
                </button>
              ))}
            </div>
          )}

          {isSearching && (
            <p className="text-sm text-muted-foreground">
              Buscando...
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                País
              </Label>
              <Input
                value={config.Pais}
                readOnly
                className="bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Ciudad
              </Label>
              <Input
                value={config.Ciudad}
                readOnly
                className="bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Latitud (°)
              </Label>
              <Input
                value={config.Latitud}
                readOnly
                className="bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Longitud (°)
              </Label>
              <Input
                value={config.Longitud}
                readOnly
                className="bg-background"
              />
            </div>
          </div>
        </div>
      </SectionPanel>

      {/* Planta */}
      <SectionPanel icon={Factory} title="Parámetros de la planta" description="Configuración global de la instalación">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="h-10 flex items-end text-xs text-muted-foreground">Cantidad de paneles</Label>
            <Input
              type="number"
              step={1}
              value={config.Paneles ?? ""}
              onChange={(e) =>
                updateField(
                  "Paneles",
                  e.target.value === "" ? null : Number(e.target.value)
                )
              }
              className="bg-background"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="h-10 flex items-end text-xs text-muted-foreground">Ángulo de instalación (°)</Label>
            <Input
              type="number"
              step={0.1}
              value={config.Angulo_Instalacion ?? ""}
              onChange={(e) =>
                updateField(
                  "Angulo_Instalacion",
                  e.target.value === "" ? null : Number(e.target.value)
                )
              }
              className="bg-background"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1 text-xs text-muted-foreground mt-6">
              <Compass className="h-3.5 w-3.5" />
              Orientación de los paneles
            </Label>
            <Select value={config.Orientacion} onValueChange={(v) => updateField("Orientacion", v as Orientation)}>
              <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                {orientations.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {orientacionIncorrecta && (
              <p className="text-xs text-red-500 mt-1">
                Orientación incorrecta para tu hemisferio
              </p>
            )}
          </div>
        </div>


        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          <div className="space-y-1.5">
            <Label className="h-10 flex items-end text-xs text-muted-foreground">
              Fecha de instalación
            </Label>

            <Input
              type="date"
              value={config.Fecha_Instalacion ?? ""}
              onChange={(e) =>
                updateField(
                  "Fecha_Instalacion",
                  e.target.value
                )
              }
              className="bg-background calendario-blanco"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="h-10 flex items-end text-xs text-muted-foreground">
              Pérdidas eléctricas estimadas (Entre 2% y 10% segun su instalación)
            </Label>

            <Input
              type="number"
              step={1}
              value={config.Perdida_Otros ?? ""}
              onChange={(e) =>
                updateField(
                  "Perdida_Otros",
                  e.target.value === "" ? null : Number(e.target.value)
                )
              }
              className="bg-background"
            />
          </div>

        </div>

      </SectionPanel>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-lg transition-all duration-300", estadoGuardado === "pendiente" ? "bg-red-500/10 text-red-600" : "bg-green-500/10 text-green-600")}>
              <Save className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Guardar cambios</h2>
              <p className="text-xs text-muted-foreground">{estadoGuardado === "pendiente" ? "¿Desea guardar los cambios?" : "Parámetros guardados correctamente"}</p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-primary-foreground hover:bg-primary/90 
                    text-base sm:text-lg 
                    py-2.5 sm:py-3 
                    px-4 sm:px-8 
                    w-full sm:w-auto"
          >
            <Save className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

    </div>

  );
}

function SectionPanel({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: any;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
