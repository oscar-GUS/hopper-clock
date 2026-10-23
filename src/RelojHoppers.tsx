import { useEffect, useRef, useState } from 'react'

// ─── Mecánica del reloj de hoppers (reloj cíclico de 2 hoppers) ──────────────
// Un hopper transfiere 1 ítem cada 8 game ticks = 4 redstone ticks = 0.4 s.
// El reloj cíclico vacía un hopper (medio ciclo) y luego el otro (vuelta), así
// que el periodo completo = 2 medios ciclos.
//   medio ciclo  = items × 0.4 s            (− 0.025 s de retraso real opcional)
//   ciclo completo = 2 × medio ciclo
const SEG_POR_ITEM = 0.4    // segundos por ítem transferido
const GT_POR_ITEM  = 8      // game ticks por ítem
const RT_POR_ITEM  = 4      // redstone ticks por ítem
const DELAY_MEDIO  = 0.025  // retraso real por medio ciclo (s)
const STACK        = 64
const MAX_ITEMS    = 320    // 5 slots × 64 por hopper

type Modo = 'tiempo' | 'items'

// medio ciclo y ciclo completo a partir de los ítems de un hopper
const medioCiclo = (n: number, corr: boolean) => n * SEG_POR_ITEM - (corr ? DELAY_MEDIO : 0)
const cicloFull  = (n: number, corr: boolean) => 2 * medioCiclo(n, corr)

function fmtTiempo(sec: number): string {
  if (sec <= 0) return '0 s'
  const totalMs = Math.round(sec * 1000)
  const h  = Math.floor(totalMs / 3_600_000)
  const m  = Math.floor((totalMs % 3_600_000) / 60_000)
  const s  = Math.floor((totalMs % 60_000) / 1000)
  const ms = totalMs % 1000
  const parts: string[] = []
  if (h) parts.push(`${h} h`)
  if (m || h) parts.push(`${m} min`)
  parts.push(`${s} s`)
  if (ms) parts.push(`${ms} ms`)
  return parts.join(' ')
}

function fmtStacks(items: number): string {
  if (items < STACK) return `${items} ítem${items === 1 ? '' : 's'}`
  const st = Math.floor(items / STACK), rem = items % STACK
  return rem > 0
    ? `${st} stack${st === 1 ? '' : 's'} + ${rem}`
    : `${st} stack${st === 1 ? '' : 's'}`
}

function StatRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#1E1E21] last:border-0">
      <span className="text-sm text-[#71717A]">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${accent ? 'text-[#F4811F]' : 'text-[#F5F5F0]'}`}>{value}</span>
    </div>
  )
}

export default function RelojHoppers() {
  const [modo, setModo]       = useState<Modo>('tiempo')
  const [horas, setHoras]     = useState('0')
  const [minutos, setMinutos] = useState('1')
  const [segundos, setSegundos] = useState('15')
  const [itemsVal, setItems]  = useState('76')
  const [corr, setCorr]       = useState(true)   // aplicar −0.025 s por medio ciclo

  // Easter egg: al fijar ciertos valores exactos, MineLite comprueba si desbloquean
  // un logro secreto. Al estar embebido por <iframe>, no tenemos sesión aquí, así que
  // se avisa al parent (MineLite) por postMessage y ES ÉL quien llama a su API con la
  // sesión del usuario. Los números concretos del logro viven solo en el servidor.
  const primeraRef = useRef(true)
  useEffect(() => {
    if (primeraRef.current) { primeraRef.current = false; return }
    if (typeof window === 'undefined' || window.parent === window) return  // solo embebido
    const t = setTimeout(() => {
      window.parent.postMessage({
        source: 'hopper-clock',
        evento: 'hopper_clock',
        payload: {
          horas:    parseInt(horas)    || 0,
          minutos:  parseInt(minutos)  || 0,
          segundos: parseInt(segundos) || 0,
          items:    parseFloat(itemsVal) || 0,
        },
      }, '*')
      // Y para la analítica de MineLite: alguien ha calculado algo (se cuenta una vez por visita).
      window.parent.postMessage({ fuente: 'minelite-tool', tipo: 'tool_use', accion: 'calcular' }, '*')
    }, 700)
    return () => clearTimeout(t)
  }, [horas, minutos, segundos, itemsVal])

  // ── Modo tiempo → ítems (el tiempo pedido = ciclo completo) ──
  const segDeseados = Math.max(0,
    (parseFloat(horas)    || 0) * 3600 +
    (parseFloat(minutos)  || 0) * 60 +
    (parseFloat(segundos) || 0))
  // ciclo = 2(0.4n − corr)  →  n = (ciclo/2 + corr) / 0.4 ; redondeamos hacia arriba
  // para garantizar que el reloj nunca dure menos de lo pedido.
  const nIdeal = (segDeseados / 2 + (corr ? DELAY_MEDIO : 0)) / SEG_POR_ITEM
  const itemsNecesarios = Math.max(0, Math.ceil(nIdeal - 1e-9))
  const itemsClamp = Math.min(itemsNecesarios, MAX_ITEMS)
  const segReales  = cicloFull(itemsClamp, corr)
  const errorSeg   = segReales - segDeseados
  const excede     = itemsNecesarios > MAX_ITEMS

  // ── Modo ítems → tiempo ──
  // Se permiten decimales (para afinar el tiempo al milisegundo); no se trunca.
  const itemsEntrada = Math.max(0, Math.min(MAX_ITEMS, parseFloat(itemsVal) || 0))
  const cicloSeg = cicloFull(itemsEntrada, corr)
  const medioSeg = medioCiclo(itemsEntrada, corr)

  return (
    <main className="min-h-screen bg-[#0D0D0F]">
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-10">

        {/* Título */}
        <div className="mb-8 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#1C1C1F] border border-[#2A2A2E] flex items-center justify-center">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-[#F4811F]">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#F5F5F0]">HopperClock Calculator</h1>
          <p className="mt-2 text-sm text-[#71717A]">Calcula los ítems para el tiempo que quieras, o el tiempo según los ítems.</p>
        </div>

        {/* Tabs de modo */}
        <div className="flex rounded-xl overflow-hidden border border-[#2A2A2E] mb-4" style={{ background: '#161618' }}>
          {([['tiempo', 'Tiempo → Ítems'], ['items', 'Ítems → Tiempo']] as [Modo, string][]).map(([m, label], i) => (
            <button key={m} onClick={() => setModo(m)}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${i > 0 ? 'border-l border-[#2A2A2E]' : ''}`}
              style={modo === m ? { background: '#F4811F', color: '#0d0d0f' } : { color: '#A1A1AA' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Toggle corrección −0.025 s */}
        <label className="flex items-center gap-2.5 mb-6 px-1 cursor-pointer select-none">
          <input type="checkbox" checked={corr} onChange={(e) => setCorr(e.target.checked)}
            className="w-4 h-4 accent-[#F4811F] cursor-pointer" />
          <span className="text-xs text-[#A1A1AA]">
            Aplicar el retraso real de <span className="text-[#F5F5F0] font-medium">−0.025 s por medio ciclo</span>
            <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#F4811F]/15 text-[#F4811F] border border-[#F4811F]/30">recomendado</span>
          </span>
        </label>

        {/* ── Modo: Tiempo → Ítems ── */}
        {modo === 'tiempo' && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-[#2A2A2E] bg-[#161618] p-5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-3">Tiempo deseado (ciclo completo)</label>
              <div className="grid grid-cols-3 gap-2">
                {([['Horas', horas, setHoras], ['Minutos', minutos, setMinutos], ['Segundos', segundos, setSegundos]] as [string, string, (v: string) => void][]).map(([lbl, val, set]) => (
                  <div key={lbl}>
                    <input
                      type="number" min="0" step="any" value={val}
                      onChange={(e) => { const v = e.target.value; if (v === '' || parseFloat(v) >= 0) set(v) }}
                      className="w-full bg-[#0D0D0F] border border-[#2A2A2E] rounded-xl px-3 py-3 text-lg font-semibold text-[#F5F5F0] tabular-nums focus:outline-none focus:border-[#F4811F] transition-colors text-center"
                    />
                    <p className="mt-1.5 text-center text-[11px] text-[#71717A]">{lbl}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Resultado */}
            <div className="rounded-2xl border border-[#F4811F]/30 bg-gradient-to-br from-[#1A1310] to-[#161618] p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1">Ítems por hopper</p>
              <p className="text-5xl font-bold text-[#F4811F] tabular-nums">{itemsClamp}</p>
              <p className="mt-1 text-sm text-[#A1A1AA]">{fmtStacks(itemsClamp)}</p>

              <div className="mt-5">
                <StatRow label="Tiempo real conseguido" value={fmtTiempo(segReales)} accent />
                {Math.abs(errorSeg) >= 0.001 && (
                  <StatRow label="Diferencia con lo pedido" value={`${errorSeg > 0 ? '+' : '−'}${fmtTiempo(Math.abs(errorSeg))}`} />
                )}
                <StatRow label="Medio ciclo (un pulso)" value={fmtTiempo(medioCiclo(itemsClamp, corr))} />
                <StatRow label="Equivale a" value={`${itemsClamp * GT_POR_ITEM} gt · ${itemsClamp * RT_POR_ITEM} rt`} />
              </div>

              {excede && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#F4811F]/10 border border-[#F4811F]/25 px-3 py-2.5">
                  <span className="text-[#F4811F] text-sm shrink-0">⚠</span>
                  <p className="text-xs text-[#D4A574] leading-relaxed">
                    Un hopper solo aguanta {MAX_ITEMS} ítems (máx. {fmtTiempo(cicloFull(MAX_ITEMS, corr))} de ciclo).
                    Para tiempos mayores encadena varios relojes en serie y multiplica sus tiempos.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Modo: Ítems → Tiempo ── */}
        {modo === 'items' && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-[#2A2A2E] bg-[#161618] p-5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-3">
                Ítems en el hopper <span className="text-[#52525A] normal-case font-normal">(0–{MAX_ITEMS})</span>
              </label>
              <input
                type="number" min="0" max={MAX_ITEMS} step="0.05" value={itemsVal}
                onChange={(e) => { const v = e.target.value; if (v === '' || parseFloat(v) >= 0) setItems(v) }}
                className="w-full bg-[#0D0D0F] border border-[#2A2A2E] rounded-xl px-4 py-3 text-lg font-semibold text-[#F5F5F0] tabular-nums focus:outline-none focus:border-[#F4811F] transition-colors"
              />
              <input
                type="range" min="0" max={MAX_ITEMS} step="0.05" value={itemsEntrada}
                onChange={(e) => setItems(e.target.value)}
                className="w-full mt-4 accent-[#F4811F] cursor-pointer"
              />
              <p className="mt-2 text-xs text-[#71717A]">{fmtStacks(itemsEntrada)}</p>
            </div>

            <div className="rounded-2xl border border-[#F4811F]/30 bg-gradient-to-br from-[#1A1310] to-[#161618] p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1">Ciclo completo</p>
              <p className="text-5xl font-bold text-[#F4811F] tabular-nums">{fmtTiempo(cicloSeg)}</p>

              <div className="mt-5">
                <StatRow label="Medio ciclo (un pulso)" value={fmtTiempo(medioSeg)} accent />
                <StatRow label="En segundos" value={`${Math.round(cicloSeg * 1000) / 1000} s`} />
                <StatRow label="Equivale a" value={`${itemsEntrada * GT_POR_ITEM} gt · ${itemsEntrada * RT_POR_ITEM} rt`} />
              </div>
            </div>
          </div>
        )}

        {/* Cómo funciona */}
        <div className="mt-8 rounded-2xl border border-[#2A2A2E] bg-[#161618] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-3">Cómo funciona</p>
          <ul className="space-y-2 text-sm text-[#A1A1AA] leading-relaxed">
            <li>· Reloj cíclico de 2 hoppers enfrentados. Un hopper transfiere <span className="text-[#F5F5F0] font-medium">1 ítem cada 0.4 s</span> (8 game ticks / 4 redstone ticks).</li>
            <li>· Vaciar un hopper es <span className="text-[#F5F5F0] font-medium">medio ciclo</span> (un pulso); el reloj rebota y vuelve, así que el <span className="text-[#F5F5F0] font-medium">ciclo completo = 2 × ítems × 0.4 s</span>.</li>
            <li>· El retraso real de −0.025 s por medio ciclo viene de los pistones; déjalo activado para clavar el tiempo.</li>
            <li>· Máximo {MAX_ITEMS} ítems por hopper → hasta {fmtTiempo(cicloFull(MAX_ITEMS, corr))} de ciclo. Para más, encadena relojes.</li>
          </ul>
        </div>

      </div>
    </main>
  )
}
