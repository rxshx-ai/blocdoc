import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Bell,
  CalendarClock,
  CirclePlus,
  ClipboardCheck,
  FileClock,
  LogOut,
  MapPinned,
  PackageCheck,
  ScanLine,
  ShieldCheck,
  Truck,
  UserRound,
} from 'lucide-react'

type Role = 'admin' | 'shipper' | 'provider' | 'driver' | 'receiver'

type Session = {
  access_token: string
  token_type: string
  username: string
  role: Role
  actor_id: string
}

type Shipment = {
  shipment_id: string
  sender_entity: string
  receiver_entity: string
  sender_name?: string | null
  sender_contact?: string | null
  receiver_name?: string | null
  receiver_contact?: string | null
  pickup_location: string
  delivery_location: string
  pickup_latitude: number
  pickup_longitude: number
  delivery_latitude: number
  delivery_longitude: number
  pickup_time?: string | null
  cargo_type: string
  temperature_requirement: number
  handling_notes?: string | null
  status: string
  selected_provider: string | null
  assigned_driver_id: string | null
}

type Bid = {
  provider_id: string
  provider_address: string
  price: number
  estimated_delivery_time: number
  vehicle_type: string
  driver_id: string
}

type UserRecord = {
  username: string
  role: Role
  actor_id: string | null
}

type TelemetryEvent = {
  temperature?: number
  humidity?: number
  latitude?: number
  longitude?: number
  timestamp?: string
}

type QrBundle = {
  shipment_id: string
  status: string
  assigned_driver_id: string | null
  qr_payload: {
    nonce: string
    expiration_time: string
    pickup_location_hash?: string
    delivery_location_hash?: string
  }
  qr_image_data_uri: string
  created_at: string
}

type Persona = {
  id: string
  title: string
  subtitle: string
  username: string
  password: string
  role: Role
  entity?: string
  counterpart?: string
}

const sessionKey = 'final1.frontend.session'

const personas: Persona[] = [
  {
    id: 'manufacturer',
    title: 'Pharmaceutical Manufacturer',
    subtitle: 'Creates outbound cold-chain shipment requests.',
    username: 'shipper',
    password: 'shipper123',
    role: 'shipper',
    entity: 'PHARMACEUTICAL_MANUFACTURER',
    counterpart: 'MEDICAL_DISTRIBUTION_CENTER',
  },
  {
    id: 'distribution-center',
    title: 'Medical Distribution Center',
    subtitle: 'Dispatches inventory to hospitals and providers.',
    username: 'hospital',
    password: 'hospital123',
    role: 'shipper',
    entity: 'MEDICAL_DISTRIBUTION_CENTER',
    counterpart: 'HOSPITAL',
  },
  {
    id: 'hospital',
    title: 'Hospital',
    subtitle: 'Creates pickup-ready shipment requests and shows sender QR.',
    username: 'hospital',
    password: 'hospital123',
    role: 'shipper',
    entity: 'HOSPITAL',
    counterpart: 'HEALTHCARE_PROVIDER',
  },
  {
    id: 'lab',
    title: 'Diagnostic Laboratory',
    subtitle: 'Creates urgent sample and temperature-sensitive consignments.',
    username: 'lab',
    password: 'lab123',
    role: 'shipper',
    entity: 'DIAGNOSTIC_LABORATORY',
    counterpart: 'HOSPITAL',
  },
  {
    id: 'transport-provider',
    title: 'Licensed Medical Transportation Provider',
    subtitle: 'Places bids, wins jobs, and coordinates drivers.',
    username: 'partner',
    password: 'partner123',
    role: 'provider',
  },
  {
    id: 'driver',
    title: 'Field Driver Portal',
    subtitle: 'Receives assigned job, reaches site, and scans QR checkpoints.',
    username: 'driver',
    password: 'driver123',
    role: 'driver',
  },
  {
    id: 'healthcare-provider',
    title: 'Healthcare Provider / Receiver',
    subtitle: 'Displays delivery QR at destination and confirms receipt.',
    username: 'clinic',
    password: 'clinic123',
    role: 'receiver',
    entity: 'HEALTHCARE_PROVIDER',
  },
  {
    id: 'admin',
    title: 'Healthcare Administrator',
    subtitle: 'Oversees users, network health, and shipment governance.',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
  },
  {
    id: 'regulator',
    title: 'Regulatory Body',
    subtitle: 'Reviews the same command surface with governance oversight.',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
  },
]

async function apiRequest<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers ?? {})

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
  })

  const text = await response.text()
  const payload = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(payload?.detail ?? payload?.message ?? `Request failed: ${response.status}`)
  }

  return payload as T
}

function formatDate(value?: string | null): string {
  if (!value) {
    return 'Not scheduled'
  }

  return new Date(value).toLocaleString()
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value)
}

function routePoint(lat: number, lng: number): { x: number; y: number } {
  return {
    x: Math.max(10, Math.min(90, ((lng + 180) / 360) * 100)),
    y: Math.max(10, Math.min(90, 100 - ((lat + 90) / 180) * 100)),
  }
}

function emptyIfBlank(value: string): string | null {
  return value.trim() ? value.trim() : null
}

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [booting, setBooting] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [activity, setActivity] = useState<string[]>([])
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [selectedShipmentId, setSelectedShipmentId] = useState('')
  const [bids, setBids] = useState<Bid[]>([])
  const [telemetry, setTelemetry] = useState<TelemetryEvent[]>([])
  const [users, setUsers] = useState<UserRecord[]>([])
  const [pickupQr, setPickupQr] = useState<QrBundle | null>(null)
  const [deliveryQr, setDeliveryQr] = useState<QrBundle | null>(null)
  const [loginForm, setLoginForm] = useState({ username: 'hospital', password: 'hospital123' })
  const [shipmentForm, setShipmentForm] = useState({
    shipment_id: 'REQ-2001',
    sender_entity: 'HOSPITAL',
    receiver_entity: 'HEALTHCARE_PROVIDER',
    sender_name: 'North City Hospital',
    sender_contact: '+91 9876500010',
    receiver_name: 'Downtown Clinic',
    receiver_contact: '+91 9876500011',
    pickup_location: 'North City Hospital Pharmacy Bay',
    delivery_location: 'Downtown Clinic Receiving Desk',
    pickup_latitude: '12.9716',
    pickup_longitude: '77.5946',
    delivery_latitude: '12.9352',
    delivery_longitude: '77.6245',
    pickup_time: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
    cargo_type: 'Vaccines',
    temperature_requirement: '4',
    handling_notes: 'Keep upright. Seal crate before dispatch.',
    escrow_amount_wei: '0',
  })
  const [bidForm, setBidForm] = useState({
    shipment_id: '',
    provider_id: 'partner-001',
    provider_address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    price: '1000000000000000',
    estimated_delivery_time: '3600',
    vehicle_type: 'Refrigerated Van',
    driver_id: 'driver-001',
  })
  const [arrivalForm, setArrivalForm] = useState({
    shipment_id: '',
    driver_id: 'driver-001',
    driver_latitude: '12.9716',
    driver_longitude: '77.5946',
  })
  const [pickupVerifyForm, setPickupVerifyForm] = useState({
    shipment_id: '',
    pickup_location_hash: '',
    nonce: '',
    expiration_time: '',
    driver_id: 'driver-001',
    driver_latitude: '12.9716',
    driver_longitude: '77.5946',
  })
  const [deliveryVerifyForm, setDeliveryVerifyForm] = useState({
    shipment_id: '',
    delivery_location_hash: '',
    nonce: '',
    expiration_time: '',
    driver_id: 'driver-001',
    driver_latitude: '12.9352',
    driver_longitude: '77.6245',
    telemetry_hash: 'QmTestTelemetryHash123',
  })
  const [createUserForm, setCreateUserForm] = useState({ username: '', password: '', role: 'receiver', actor_id: '' })

  useEffect(() => {
    const raw = window.localStorage.getItem(sessionKey)
    if (raw) {
      try {
        setSession(JSON.parse(raw) as Session)
      } catch {
        window.localStorage.removeItem(sessionKey)
      }
    }
    setBooting(false)
  }, [])

  useEffect(() => {
    if (!session) {
      return
    }

    void refreshWorkspace(session)
  }, [session])

  useEffect(() => {
    if (!selectedShipmentId) {
      return
    }

    setBidForm((current) => ({ ...current, shipment_id: selectedShipmentId }))
    setArrivalForm((current) => ({ ...current, shipment_id: selectedShipmentId }))
    setPickupVerifyForm((current) => ({ ...current, shipment_id: selectedShipmentId }))
    setDeliveryVerifyForm((current) => ({ ...current, shipment_id: selectedShipmentId }))
  }, [selectedShipmentId])

  const selectedShipment = shipments.find((item) => item.shipment_id === selectedShipmentId) ?? null

  const stats = useMemo(() => {
    const created = shipments.filter((item) => item.status === 'CREATED').length
    const bidding = shipments.filter((item) => item.status === 'BIDDING').length
    const assigned = shipments.filter((item) => item.status === 'PROVIDER_SELECTED').length
    const transit = shipments.filter((item) => item.status === 'IN_TRANSIT').length

    return [
      { label: 'Requests', value: shipments.length },
      { label: 'Open Bidding', value: bidding + created },
      { label: 'Assigned Runs', value: assigned },
      { label: 'In Transit', value: transit },
    ]
  }, [shipments])

  const selectedPersona = personas.find((persona) => persona.username === session?.username) ?? null

  async function withTask(label: string, task: () => Promise<void>): Promise<void> {
    setBusy(label)
    setError('')
    try {
      await task()
      setActivity((current) => [`${new Date().toLocaleTimeString()}  ${label}`, ...current].slice(0, 10))
    } catch (taskError) {
      setError(taskError instanceof Error ? taskError.message : 'Unknown error')
    } finally {
      setBusy('')
    }
  }

  async function refreshWorkspace(activeSession = session): Promise<void> {
    if (!activeSession) {
      return
    }

    const shipmentResponse = await apiRequest<{ shipments: Shipment[] }>('/shipments', {}, activeSession.access_token)
    setShipments(shipmentResponse.shipments)

    if (!selectedShipmentId && shipmentResponse.shipments.length > 0) {
      setSelectedShipmentId(shipmentResponse.shipments[0].shipment_id)
    }

    if (activeSession.role === 'admin') {
      const userResponse = await apiRequest<{ users: UserRecord[] }>('/admin/users', {}, activeSession.access_token)
      setUsers(userResponse.users)
    }
  }

  async function login(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    await withTask('Starting session', async () => {
      const nextSession = await apiRequest<Session>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginForm),
      })
      window.localStorage.setItem(sessionKey, JSON.stringify(nextSession))
      setSession(nextSession)

      const persona = personas.find((item) => item.username === nextSession.username)
      if (persona?.entity) {
        setShipmentForm((current) => ({
          ...current,
          sender_entity: persona.entity ?? current.sender_entity,
          receiver_entity: persona.counterpart ?? current.receiver_entity,
        }))
      }
    })
  }

  function logout(): void {
    window.localStorage.removeItem(sessionKey)
    setSession(null)
    setShipments([])
    setSelectedShipmentId('')
    setBids([])
    setUsers([])
    setTelemetry([])
    setPickupQr(null)
    setDeliveryQr(null)
  }

  async function loadBids(): Promise<void> {
    if (!session || !selectedShipmentId) {
      return
    }

    await withTask('Loading bid board', async () => {
      const response = await apiRequest<{ bids: Bid[] }>(`/shipment/${selectedShipmentId}/bids`, {}, session.access_token)
      setBids(response.bids)
    })
  }

  async function createShipment(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (!session) {
      return
    }

    await withTask('Creating shipment request', async () => {
      await apiRequest('/shipment/create', {
        method: 'POST',
        body: JSON.stringify({
          ...shipmentForm,
          sender_name: emptyIfBlank(shipmentForm.sender_name),
          sender_contact: emptyIfBlank(shipmentForm.sender_contact),
          receiver_name: emptyIfBlank(shipmentForm.receiver_name),
          receiver_contact: emptyIfBlank(shipmentForm.receiver_contact),
          pickup_time: shipmentForm.pickup_time ? new Date(shipmentForm.pickup_time).toISOString() : null,
          handling_notes: emptyIfBlank(shipmentForm.handling_notes),
          pickup_latitude: Number(shipmentForm.pickup_latitude),
          pickup_longitude: Number(shipmentForm.pickup_longitude),
          delivery_latitude: Number(shipmentForm.delivery_latitude),
          delivery_longitude: Number(shipmentForm.delivery_longitude),
          temperature_requirement: Number(shipmentForm.temperature_requirement),
          escrow_amount_wei: Number(shipmentForm.escrow_amount_wei),
        }),
      }, session.access_token)

      await refreshWorkspace(session)
      setSelectedShipmentId(shipmentForm.shipment_id)
    })
  }

  async function submitBid(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (!session) {
      return
    }

    await withTask('Submitting delivery bid', async () => {
      await apiRequest('/bid', {
        method: 'POST',
        body: JSON.stringify({
          ...bidForm,
          price: Number(bidForm.price),
          estimated_delivery_time: Number(bidForm.estimated_delivery_time),
        }),
      }, session.access_token)
      await refreshWorkspace(session)
      await loadBids()
    })
  }

  async function selectProvider(): Promise<void> {
    if (!session || !selectedShipmentId) {
      return
    }

    await withTask('Running provider selection', async () => {
      await apiRequest('/shipment/select_provider', {
        method: 'POST',
        body: JSON.stringify({ shipment_id: selectedShipmentId }),
      }, session.access_token)
      await refreshWorkspace(session)
      await loadBids()
    })
  }

  async function markArrivedAtPickup(): Promise<void> {
    if (!session) {
      return
    }

    await withTask('Driver arrived at pickup', async () => {
      await apiRequest('/shipment/arrived_pickup', {
        method: 'POST',
        body: JSON.stringify({
          ...arrivalForm,
          driver_latitude: Number(arrivalForm.driver_latitude),
          driver_longitude: Number(arrivalForm.driver_longitude),
        }),
      }, session.access_token)

      if (arrivalForm.shipment_id) {
        await loadPickupQr(arrivalForm.shipment_id)
      }
    })
  }

  async function loadPickupQr(shipmentId = selectedShipmentId): Promise<void> {
    if (!session || !shipmentId) {
      return
    }

    await withTask('Loading sender pickup QR', async () => {
      const response = await apiRequest<QrBundle>(`/shipment/${shipmentId}/pickup_qr`, {}, session.access_token)
      setPickupQr(response)
      setPickupVerifyForm((current) => ({
        ...current,
        shipment_id: shipmentId,
        pickup_location_hash: response.qr_payload.pickup_location_hash ?? '',
        nonce: response.qr_payload.nonce,
        expiration_time: response.qr_payload.expiration_time,
      }))
    })
  }

  async function verifyPickup(): Promise<void> {
    if (!session) {
      return
    }

    await withTask('Driver scanning pickup QR', async () => {
      await apiRequest('/shipment/verify_pickup_qr', {
        method: 'POST',
        body: JSON.stringify({
          ...pickupVerifyForm,
          driver_latitude: Number(pickupVerifyForm.driver_latitude),
          driver_longitude: Number(pickupVerifyForm.driver_longitude),
        }),
      }, session.access_token)
      await refreshWorkspace(session)
    })
  }

  async function markArrivedAtDelivery(): Promise<void> {
    if (!session) {
      return
    }

    await withTask('Driver arrived at delivery', async () => {
      await apiRequest('/shipment/arrived_delivery', {
        method: 'POST',
        body: JSON.stringify({
          ...arrivalForm,
          driver_latitude: Number(arrivalForm.driver_latitude),
          driver_longitude: Number(arrivalForm.driver_longitude),
        }),
      }, session.access_token)

      if (arrivalForm.shipment_id) {
        await loadDeliveryQr(arrivalForm.shipment_id)
      }
    })
  }

  async function loadDeliveryQr(shipmentId = selectedShipmentId): Promise<void> {
    if (!session || !shipmentId) {
      return
    }

    await withTask('Loading receiver delivery QR', async () => {
      const response = await apiRequest<QrBundle>(`/shipment/${shipmentId}/delivery_qr`, {}, session.access_token)
      setDeliveryQr(response)
      setDeliveryVerifyForm((current) => ({
        ...current,
        shipment_id: shipmentId,
        delivery_location_hash: response.qr_payload.delivery_location_hash ?? '',
        nonce: response.qr_payload.nonce,
        expiration_time: response.qr_payload.expiration_time,
      }))
    })
  }

  async function verifyDelivery(): Promise<void> {
    if (!session) {
      return
    }

    await withTask('Driver scanning delivery QR', async () => {
      await apiRequest('/shipment/verify_delivery_qr', {
        method: 'POST',
        body: JSON.stringify({
          ...deliveryVerifyForm,
          driver_latitude: Number(deliveryVerifyForm.driver_latitude),
          driver_longitude: Number(deliveryVerifyForm.driver_longitude),
        }),
      }, session.access_token)
      await refreshWorkspace(session)
    })
  }

  async function loadTelemetry(shipmentId = selectedShipmentId): Promise<void> {
    if (!shipmentId) {
      return
    }

    await withTask('Loading telemetry feed', async () => {
      const response = await apiRequest<{ events: TelemetryEvent[] }>(`/telemetry/shipment/${shipmentId}`)
      setTelemetry(response.events)
    })
  }

  async function createUser(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (!session) {
      return
    }

    await withTask('Creating portal user', async () => {
      await apiRequest('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          ...createUserForm,
          actor_id: emptyIfBlank(createUserForm.actor_id),
        }),
      }, session.access_token)
      const response = await apiRequest<{ users: UserRecord[] }>('/admin/users', {}, session.access_token)
      setUsers(response.users)
      setCreateUserForm({ username: '', password: '', role: 'receiver', actor_id: '' })
    })
  }

  if (booting) {
    return <div className="screen-loader">Booting workspace…</div>
  }

  if (!session) {
    return (
      <main className="product-shell login-shell">
        <section className="login-topbar">
          <div className="brand-mark">HALO</div>
          <div className="brand-copy">
            <strong>Healthcare Logistics Network</strong>
            <span>Portal access for every stakeholder in the cold-chain network</span>
          </div>
        </section>

        <section className="login-stage">
          <div className="stage-visual">
            <div className="visual-frame">
              <div className="visual-card main-visual-card">
                <div className="eyebrow">Workflow</div>
                <h1>Request, bid, assign, pickup QR, delivery QR</h1>
                <p>
                  Hospitals, labs, manufacturers, and distribution centers create requests. Transport providers bid.
                  The backend AI chooses the provider. Drivers travel to pickup and delivery points and scan the QR shown
                  by the sender and receiver portals.
                </p>
                <div className="workflow-strip">
                  <span>Sender</span>
                  <ArrowRight size={14} />
                  <span>Bids</span>
                  <ArrowRight size={14} />
                  <span>AI Select</span>
                  <ArrowRight size={14} />
                  <span>Pickup QR</span>
                  <ArrowRight size={14} />
                  <span>Delivery QR</span>
                </div>
              </div>
            </div>
          </div>

          <div className="login-panel">
            <div className="eyebrow">Network roles</div>
            <h2>Select the portal</h2>
            <div className="persona-grid">
              {personas.map((persona) => (
                <button
                  className={`persona-card ${loginForm.username === persona.username && loginForm.password === persona.password ? 'active' : ''}`}
                  key={persona.id}
                  type="button"
                  onClick={() => setLoginForm({ username: persona.username, password: persona.password })}
                >
                  <strong>{persona.title}</strong>
                  <span>{persona.subtitle}</span>
                </button>
              ))}
            </div>

            <form className="portal-form" onSubmit={login}>
              <label>
                Username
                <input value={loginForm.username} onChange={(event) => setLoginForm((current) => ({ ...current, username: event.target.value }))} />
              </label>
              <label>
                Password
                <input type="password" value={loginForm.password} onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))} />
              </label>
              <button className="primary-action" type="submit" disabled={Boolean(busy)}>
                {busy || 'Enter portal'}
              </button>
            </form>
            {error ? <div className="error-banner">{error}</div> : null}
          </div>
        </section>
      </main>
    )
  }

  const pickupPoint = selectedShipment ? routePoint(selectedShipment.pickup_latitude, selectedShipment.pickup_longitude) : null
  const deliveryPoint = selectedShipment ? routePoint(selectedShipment.delivery_latitude, selectedShipment.delivery_longitude) : null

  return (
    <main className="product-shell dashboard-shell-refined">
      <header className="dashboard-topbar">
        <div className="topbar-identity">
          <div className="brand-mark">HALO</div>
          <div>
            <strong>{selectedPersona?.title ?? session.role}</strong>
            <span>{selectedPersona?.subtitle ?? 'Operational portal'}</span>
          </div>
        </div>
        <div className="topbar-tools">
          <button className="icon-button" type="button"><Bell size={18} /></button>
          <button className="icon-button" type="button"><ShieldCheck size={18} /></button>
          <button className="primary-action dark" type="button" onClick={logout}><LogOut size={16} /> Logout</button>
        </div>
      </header>

      <section className="dashboard-grid-refined">
        <aside className="left-rail panel-card">
          <div className="rail-profile">
            <div className="avatar-orb">{session.username.slice(0, 1).toUpperCase()}</div>
            <div>
              <strong>{session.username}</strong>
              <span>{session.actor_id}</span>
            </div>
          </div>
          <div className="rail-nav">
            <div className="rail-nav-item active">Overview</div>
            <div className="rail-nav-item">Shipment board</div>
            <div className="rail-nav-item">Checkpoint QR</div>
            <div className="rail-nav-item">Telemetry</div>
          </div>
          <div className="rail-stats">
            {stats.map((item) => (
              <div className="rail-stat" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </aside>

        <section className="main-column">
          <article className="panel-card hero-panel-refined">
            <div className="panel-headline-row">
              <div>
                <div className="eyebrow">Shipment lifecycle</div>
                <h2>From sender request to receiver confirmation</h2>
              </div>
              <button className="secondary-action" type="button" onClick={() => void withTask('Refreshing workspace', () => refreshWorkspace())}>
                Refresh workspace
              </button>
            </div>

            <div className="hero-panel-grid">
              <div className="route-canvas">
                <div className="canvas-grid" />
                {pickupPoint && deliveryPoint ? (
                  <>
                    <svg className="route-line" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <line x1={pickupPoint.x} y1={pickupPoint.y} x2={deliveryPoint.x} y2={deliveryPoint.y} />
                    </svg>
                    <div className="canvas-point pickup" style={{ left: `${pickupPoint.x}%`, top: `${pickupPoint.y}%` }}>P</div>
                    <div className="canvas-point delivery" style={{ left: `${deliveryPoint.x}%`, top: `${deliveryPoint.y}%` }}>D</div>
                  </>
                ) : (
                  <div className="canvas-empty">Select a shipment from the board.</div>
                )}
              </div>

              <div className="hero-side-panel">
                <div className="shipment-selector-box">
                  <label>
                    Active shipment
                    <select value={selectedShipmentId} onChange={(event) => setSelectedShipmentId(event.target.value)}>
                      <option value="">Select shipment</option>
                      {shipments.map((shipment) => (
                        <option key={shipment.shipment_id} value={shipment.shipment_id}>{shipment.shipment_id}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="milestone-list">
                  <div className="milestone-item"><CirclePlus size={16} /> Sender creates request</div>
                  <div className="milestone-item"><FileClock size={16} /> Delivery partners bid</div>
                  <div className="milestone-item"><ShieldCheck size={16} /> AI ranks and assigns</div>
                  <div className="milestone-item"><ScanLine size={16} /> Sender QR scanned at pickup</div>
                  <div className="milestone-item"><PackageCheck size={16} /> Receiver QR scanned at delivery</div>
                </div>
              </div>
            </div>
          </article>

          <article className="panel-card shipments-panel">
            <div className="section-header">
              <div>
                <div className="eyebrow">Request board</div>
                <h3>Network shipments</h3>
              </div>
              <button className="secondary-action" type="button" onClick={() => void loadTelemetry()}>
                Load telemetry
              </button>
            </div>

            <div className="shipment-board">
              {shipments.length ? shipments.map((shipment) => (
                <button
                  className={`shipment-card ${shipment.shipment_id === selectedShipmentId ? 'selected' : ''}`}
                  key={shipment.shipment_id}
                  type="button"
                  onClick={() => setSelectedShipmentId(shipment.shipment_id)}
                >
                  <div>
                    <strong>{shipment.shipment_id}</strong>
                    <span>{shipment.cargo_type}</span>
                  </div>
                  <div>
                    <strong>{shipment.status}</strong>
                    <span>{shipment.pickup_location}</span>
                  </div>
                  <div>
                    <strong>{shipment.delivery_location}</strong>
                    <span>{formatDate(shipment.pickup_time)}</span>
                  </div>
                </button>
              )) : <div className="empty-line">No shipment requests yet.</div>}
            </div>
          </article>
        </section>

        <aside className="right-column">
          <article className="panel-card detail-panel">
            <div className="section-header compact">
              <div>
                <div className="eyebrow">Shipment details</div>
                <h3>{selectedShipment?.shipment_id ?? 'No shipment selected'}</h3>
              </div>
              <MapPinned size={18} />
            </div>
            {selectedShipment ? (
              <div className="detail-grid">
                <div><span>Sender</span><strong>{selectedShipment.sender_name ?? selectedShipment.sender_entity}</strong></div>
                <div><span>Receiver</span><strong>{selectedShipment.receiver_name ?? selectedShipment.receiver_entity}</strong></div>
                <div><span>Pickup time</span><strong>{formatDate(selectedShipment.pickup_time)}</strong></div>
                <div><span>Assigned driver</span><strong>{selectedShipment.assigned_driver_id ?? 'Pending AI selection'}</strong></div>
                <div><span>Temperature</span><strong>{selectedShipment.temperature_requirement}C</strong></div>
                <div><span>Notes</span><strong>{selectedShipment.handling_notes ?? 'No special notes'}</strong></div>
              </div>
            ) : <div className="empty-line">Choose a shipment to inspect the route and workflow state.</div>}
          </article>

          <article className="panel-card log-panel-refined">
            <div className="section-header compact">
              <div>
                <div className="eyebrow">Activity</div>
                <h3>Recent actions</h3>
              </div>
              <CalendarClock size={18} />
            </div>
            <div className="activity-list">
              {activity.length ? activity.map((item) => <div className="activity-line" key={item}>{item}</div>) : <div className="empty-line">No actions yet.</div>}
            </div>
          </article>
        </aside>
      </section>

      <section className="portal-workspaces">
        {(session.role === 'shipper' || session.role === 'admin') && (
          <article className="panel-card workspace-card">
            <div className="section-header">
              <div>
                <div className="eyebrow">Sender portal</div>
                <h3>Create shipment request and show pickup QR</h3>
              </div>
              <ClipboardCheck size={18} />
            </div>

            <form className="portal-grid-form" onSubmit={createShipment}>
              <label>
                Shipment id
                <input value={shipmentForm.shipment_id} onChange={(event) => setShipmentForm((current) => ({ ...current, shipment_id: event.target.value }))} />
              </label>
              <label>
                Sender entity
                <select value={shipmentForm.sender_entity} onChange={(event) => setShipmentForm((current) => ({ ...current, sender_entity: event.target.value }))}>
                  <option value="PHARMACEUTICAL_MANUFACTURER">PHARMACEUTICAL_MANUFACTURER</option>
                  <option value="MEDICAL_DISTRIBUTION_CENTER">MEDICAL_DISTRIBUTION_CENTER</option>
                  <option value="HOSPITAL">HOSPITAL</option>
                  <option value="DIAGNOSTIC_LABORATORY">DIAGNOSTIC_LABORATORY</option>
                </select>
              </label>
              <label>
                Receiver entity
                <select value={shipmentForm.receiver_entity} onChange={(event) => setShipmentForm((current) => ({ ...current, receiver_entity: event.target.value }))}>
                  <option value="MEDICAL_DISTRIBUTION_CENTER">MEDICAL_DISTRIBUTION_CENTER</option>
                  <option value="HOSPITAL">HOSPITAL</option>
                  <option value="HEALTHCARE_PROVIDER">HEALTHCARE_PROVIDER</option>
                  <option value="DIAGNOSTIC_LABORATORY">DIAGNOSTIC_LABORATORY</option>
                </select>
              </label>
              <label>
                Sender name
                <input value={shipmentForm.sender_name} onChange={(event) => setShipmentForm((current) => ({ ...current, sender_name: event.target.value }))} />
              </label>
              <label>
                Sender contact
                <input value={shipmentForm.sender_contact} onChange={(event) => setShipmentForm((current) => ({ ...current, sender_contact: event.target.value }))} />
              </label>
              <label>
                Receiver name
                <input value={shipmentForm.receiver_name} onChange={(event) => setShipmentForm((current) => ({ ...current, receiver_name: event.target.value }))} />
              </label>
              <label>
                Receiver contact
                <input value={shipmentForm.receiver_contact} onChange={(event) => setShipmentForm((current) => ({ ...current, receiver_contact: event.target.value }))} />
              </label>
              <label>
                Pickup location
                <input value={shipmentForm.pickup_location} onChange={(event) => setShipmentForm((current) => ({ ...current, pickup_location: event.target.value }))} />
              </label>
              <label>
                Delivery location
                <input value={shipmentForm.delivery_location} onChange={(event) => setShipmentForm((current) => ({ ...current, delivery_location: event.target.value }))} />
              </label>
              <label>
                Pickup date and time
                <input type="datetime-local" value={shipmentForm.pickup_time} onChange={(event) => setShipmentForm((current) => ({ ...current, pickup_time: event.target.value }))} />
              </label>
              <label>
                Cargo type
                <input value={shipmentForm.cargo_type} onChange={(event) => setShipmentForm((current) => ({ ...current, cargo_type: event.target.value }))} />
              </label>
              <label>
                Temperature requirement
                <input value={shipmentForm.temperature_requirement} onChange={(event) => setShipmentForm((current) => ({ ...current, temperature_requirement: event.target.value }))} />
              </label>
              <label>
                Pickup latitude
                <input value={shipmentForm.pickup_latitude} onChange={(event) => setShipmentForm((current) => ({ ...current, pickup_latitude: event.target.value }))} />
              </label>
              <label>
                Pickup longitude
                <input value={shipmentForm.pickup_longitude} onChange={(event) => setShipmentForm((current) => ({ ...current, pickup_longitude: event.target.value }))} />
              </label>
              <label>
                Delivery latitude
                <input value={shipmentForm.delivery_latitude} onChange={(event) => setShipmentForm((current) => ({ ...current, delivery_latitude: event.target.value }))} />
              </label>
              <label>
                Delivery longitude
                <input value={shipmentForm.delivery_longitude} onChange={(event) => setShipmentForm((current) => ({ ...current, delivery_longitude: event.target.value }))} />
              </label>
              <label className="span-all">
                Handling notes
                <textarea value={shipmentForm.handling_notes} onChange={(event) => setShipmentForm((current) => ({ ...current, handling_notes: event.target.value }))} />
              </label>
              <button className="primary-action" type="submit">Create shipment request</button>
            </form>

            <div className="workflow-callout-row">
              <button className="secondary-action" type="button" onClick={() => void loadBids()}>View bids</button>
              <button className="primary-action dark" type="button" onClick={() => void selectProvider()}>Run AI provider selection</button>
              <button className="secondary-action" type="button" onClick={() => void loadPickupQr()}>Show pickup QR</button>
            </div>

            {pickupQr ? (
              <div className="qr-card sender-qr">
                <img alt="Pickup QR" src={pickupQr.qr_image_data_uri} />
                <div>
                  <strong>Pickup QR ready</strong>
                  <span>Show this on the sender portal once the assigned driver marks arrival.</span>
                  <span>Nonce: {pickupQr.qr_payload.nonce}</span>
                  <span>Expires: {formatDate(pickupQr.qr_payload.expiration_time)}</span>
                </div>
              </div>
            ) : null}

            {bids.length ? (
              <div className="bid-strip">
                {bids.map((bid, index) => (
                  <div className="bid-card" key={`${bid.provider_id}-${index}`}>
                    <strong>{bid.provider_id}</strong>
                    <span>{bid.vehicle_type}</span>
                    <span>{formatPrice(bid.price)} wei</span>
                  </div>
                ))}
              </div>
            ) : null}
          </article>
        )}

        {(session.role === 'provider' || session.role === 'admin') && (
          <article className="panel-card workspace-card">
            <div className="section-header">
              <div>
                <div className="eyebrow">Transportation provider portal</div>
                <h3>Bid for the job and review assignments</h3>
              </div>
              <Truck size={18} />
            </div>
            <form className="portal-grid-form compact-form" onSubmit={submitBid}>
              <label>
                Shipment id
                <input value={bidForm.shipment_id} onChange={(event) => setBidForm((current) => ({ ...current, shipment_id: event.target.value }))} />
              </label>
              <label>
                Provider id
                <input value={bidForm.provider_id} onChange={(event) => setBidForm((current) => ({ ...current, provider_id: event.target.value }))} />
              </label>
              <label>
                Provider address
                <input value={bidForm.provider_address} onChange={(event) => setBidForm((current) => ({ ...current, provider_address: event.target.value }))} />
              </label>
              <label>
                Driver id
                <input value={bidForm.driver_id} onChange={(event) => setBidForm((current) => ({ ...current, driver_id: event.target.value }))} />
              </label>
              <label>
                Vehicle type
                <input value={bidForm.vehicle_type} onChange={(event) => setBidForm((current) => ({ ...current, vehicle_type: event.target.value }))} />
              </label>
              <label>
                Price
                <input value={bidForm.price} onChange={(event) => setBidForm((current) => ({ ...current, price: event.target.value }))} />
              </label>
              <label>
                Estimated delivery time
                <input value={bidForm.estimated_delivery_time} onChange={(event) => setBidForm((current) => ({ ...current, estimated_delivery_time: event.target.value }))} />
              </label>
              <button className="primary-action" type="submit">Place bid</button>
            </form>
          </article>
        )}

        {(session.role === 'driver' || session.role === 'admin') && (
          <article className="panel-card workspace-card">
            <div className="section-header">
              <div>
                <div className="eyebrow">Driver portal</div>
                <h3>Assigned job, location, arrival, and scan workflow</h3>
              </div>
              <ScanLine size={18} />
            </div>
            <form className="portal-grid-form compact-form" onSubmit={(event) => { event.preventDefault(); void markArrivedAtPickup() }}>
              <label>
                Shipment id
                <input value={arrivalForm.shipment_id} onChange={(event) => setArrivalForm((current) => ({ ...current, shipment_id: event.target.value }))} />
              </label>
              <label>
                Driver id
                <input value={arrivalForm.driver_id} onChange={(event) => setArrivalForm((current) => ({ ...current, driver_id: event.target.value }))} />
              </label>
              <label>
                Current latitude
                <input value={arrivalForm.driver_latitude} onChange={(event) => setArrivalForm((current) => ({ ...current, driver_latitude: event.target.value }))} />
              </label>
              <label>
                Current longitude
                <input value={arrivalForm.driver_longitude} onChange={(event) => setArrivalForm((current) => ({ ...current, driver_longitude: event.target.value }))} />
              </label>
              <div className="workflow-callout-row span-all">
                <button className="secondary-action" type="submit">I have arrived at pickup</button>
                <button className="secondary-action" type="button" onClick={() => void verifyPickup()}>Scan sender QR</button>
                <button className="secondary-action" type="button" onClick={() => void markArrivedAtDelivery()}>I have arrived at delivery</button>
                <button className="primary-action dark" type="button" onClick={() => void verifyDelivery()}>Scan receiver QR</button>
              </div>
            </form>

            <div className="driver-sequence-grid">
              <div className="scan-detail-card">
                <strong>Pickup scan payload</strong>
                <span>Hash: {pickupVerifyForm.pickup_location_hash || 'Waiting for sender QR'}</span>
                <span>Nonce: {pickupVerifyForm.nonce || 'n/a'}</span>
                <span>Expires: {formatDate(pickupVerifyForm.expiration_time)}</span>
              </div>
              <div className="scan-detail-card">
                <strong>Delivery scan payload</strong>
                <span>Hash: {deliveryVerifyForm.delivery_location_hash || 'Waiting for receiver QR'}</span>
                <span>Nonce: {deliveryVerifyForm.nonce || 'n/a'}</span>
                <span>Expires: {formatDate(deliveryVerifyForm.expiration_time)}</span>
              </div>
            </div>
          </article>
        )}

        {(session.role === 'receiver' || session.role === 'admin') && (
          <article className="panel-card workspace-card">
            <div className="section-header">
              <div>
                <div className="eyebrow">Receiver portal</div>
                <h3>Display delivery QR and inspect telemetry</h3>
              </div>
              <PackageCheck size={18} />
            </div>

            <div className="workflow-callout-row">
              <button className="secondary-action" type="button" onClick={() => void loadDeliveryQr()}>Show delivery QR</button>
              <button className="primary-action dark" type="button" onClick={() => void loadTelemetry()}>Load telemetry</button>
            </div>

            {deliveryQr ? (
              <div className="qr-card receiver-qr">
                <img alt="Delivery QR" src={deliveryQr.qr_image_data_uri} />
                <div>
                  <strong>Delivery QR ready</strong>
                  <span>Present this to the driver after arrival at the receiver location.</span>
                  <span>Nonce: {deliveryQr.qr_payload.nonce}</span>
                  <span>Expires: {formatDate(deliveryQr.qr_payload.expiration_time)}</span>
                </div>
              </div>
            ) : null}

            <div className="telemetry-grid">
              {telemetry.length ? telemetry.slice(0, 6).map((item, index) => (
                <div className="telemetry-card" key={`${item.timestamp ?? 'event'}-${index}`}>
                  <strong>{formatDate(item.timestamp)}</strong>
                  <span>Temp: {item.temperature ?? 'n/a'}C</span>
                  <span>Humidity: {item.humidity ?? 'n/a'}</span>
                  <span>GPS: {item.latitude ?? 'n/a'}, {item.longitude ?? 'n/a'}</span>
                </div>
              )) : <div className="empty-line">No telemetry entries loaded.</div>}
            </div>
          </article>
        )}

        {session.role === 'admin' && (
          <article className="panel-card workspace-card">
            <div className="section-header">
              <div>
                <div className="eyebrow">Governance portal</div>
                <h3>Create and review network users</h3>
              </div>
              <UserRound size={18} />
            </div>
            <form className="portal-grid-form compact-form" onSubmit={createUser}>
              <label>
                Username
                <input value={createUserForm.username} onChange={(event) => setCreateUserForm((current) => ({ ...current, username: event.target.value }))} />
              </label>
              <label>
                Password
                <input value={createUserForm.password} onChange={(event) => setCreateUserForm((current) => ({ ...current, password: event.target.value }))} />
              </label>
              <label>
                Role
                <select value={createUserForm.role} onChange={(event) => setCreateUserForm((current) => ({ ...current, role: event.target.value as Role }))}>
                  <option value="shipper">shipper</option>
                  <option value="provider">provider</option>
                  <option value="driver">driver</option>
                  <option value="receiver">receiver</option>
                  <option value="admin">admin</option>
                </select>
              </label>
              <label>
                Actor id
                <input value={createUserForm.actor_id} onChange={(event) => setCreateUserForm((current) => ({ ...current, actor_id: event.target.value }))} />
              </label>
              <button className="primary-action" type="submit">Create portal user</button>
            </form>
            <div className="user-list-grid">
              {users.map((user) => (
                <div className="user-card" key={user.username}>
                  <strong>{user.username}</strong>
                  <span>{user.role}</span>
                  <span>{user.actor_id ?? 'n/a'}</span>
                </div>
              ))}
            </div>
          </article>
        )}
      </section>

      {busy ? <div className="busy-toast">{busy}</div> : null}
      {error ? <div className="floating-error">{error}</div> : null}
    </main>
  )
}

export default App
