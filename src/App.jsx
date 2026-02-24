import React, { useState, useRef } from 'react'
import html2canvas from 'html2canvas'
import './index.css'

const initialFriends = []

function calculateSettlements(friends) {
  if (!friends.length) return { total: 0, perPerson: 0, transfers: [] }

  const total = friends.reduce((sum, f) => sum + (Number(f.amount) || 0), 0)
  const perPerson = total / friends.length

  const balances = friends.map((f) => ({
    name: f.name,
    balance: (Number(f.amount) || 0) - perPerson,
  }))

  const creditors = balances
    .filter((b) => b.balance > 0.0001)
    .sort((a, b) => b.balance - a.balance)
  const debtors = balances
    .filter((b) => b.balance < -0.0001)
    .sort((a, b) => a.balance - b.balance)

  const transfers = []
  let i = 0
  let j = 0

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]
    const creditor = creditors[j]

    const amount = Math.min(creditor.balance, -debtor.balance)
    if (amount > 0.01) {
      transfers.push({
        from: debtor.name,
        to: creditor.name,
        amount,
      })
    }

    debtor.balance += amount
    creditor.balance -= amount

    if (Math.abs(debtor.balance) < 0.01) i++
    if (Math.abs(creditor.balance) < 0.01) j++
  }

  return { total, perPerson, transfers }
}

function HomeScreen({ onStart }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f172a',
        color: '#e5e7eb',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: isMobile ? '1rem' : '2rem',
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: '500px',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            fontSize: isMobile ? '2.5rem' : '3.5rem',
            marginBottom: '1.5rem',
          }}
        >
          💰
        </div>
        <h1
          style={{
            fontSize: isMobile ? '1.8rem' : '2.5rem',
            fontWeight: 700,
            marginBottom: '1rem',
          }}
        >
          Divisor de Gastos
        </h1>
        <p
          style={{
            fontSize: isMobile ? '0.95rem' : '1.1rem',
            color: '#9ca3af',
            marginBottom: '2rem',
            lineHeight: '1.6',
          }}
        >
          Divide gastos entre amigos de forma justa y calcula quién debe pagar a quién con las transferencias mínimas necesarias.
        </p>
        <div
          style={{
            background: 'rgba(56,189,248,0.1)',
            borderRadius: '1rem',
            padding: isMobile ? '1rem' : '1.5rem',
            marginBottom: '2rem',
            border: '1px solid rgba(56,189,248,0.3)',
          }}
        >
          <div style={{ fontSize: isMobile ? '0.85rem' : '0.9rem', color: '#9ca3af' }}>
            ✓ Gestión simple de gastos
          </div>
          <div style={{ fontSize: isMobile ? '0.85rem' : '0.9rem', color: '#9ca3af', marginTop: '0.5rem' }}>
            ✓ Cálculo automático de deudas
          </div>
          <div style={{ fontSize: isMobile ? '0.85rem' : '0.9rem', color: '#9ca3af', marginTop: '0.5rem' }}>
            ✓ Transferencias optimizadas
          </div>
        </div>
        <button
          onClick={onStart}
          style={{
            background:
              'linear-gradient(135deg, rgba(56,189,248,0.95), rgba(129,140,248,0.95))',
            borderRadius: '999px',
            border: 'none',
            padding: isMobile ? '0.65rem 1.5rem' : '0.75rem 2rem',
            color: '#020617',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: isMobile ? '0.95rem' : '1rem',
            width: '100%',
            transition: 'transform 0.2s',
            minHeight: '44px',
            touchAction: 'manipulation',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)'
          }}
        >
          Comenzar
        </button>
        <button
          onClick={() => {
            try {
              window.close()
            } catch {
              window.location.href = 'about:blank'
            }
          }}
          style={{
            background: 'transparent',
            border: '1px solid #ef4444',
            borderRadius: '999px',
            padding: isMobile ? '0.65rem 1.5rem' : '0.75rem 2rem',
            color: '#ef4444',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: isMobile ? '0.95rem' : '1rem',
            width: '100%',
            marginTop: '0.75rem',
            transition: 'all 0.2s',
            minHeight: '44px',
            touchAction: 'manipulation',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#991b1b'
            e.target.style.color = '#fca5a5'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent'
            e.target.style.color = '#ef4444'
          }}
        >
          Salir
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [showHome, setShowHome] = useState(true)
  const [friends, setFriends] = useState(initialFriends)
  const [newName, setNewName] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const transfersRef = useRef(null)
  const { total, perPerson, transfers } = calculateSettlements(friends)

  if (showHome) {
    return <HomeScreen onStart={() => setShowHome(false)} />
  }

  const handleAmountChange = (id, value) => {
    const cleaned = String(value).replace(/[^0-9.,-]/g, '').slice(0, 8)
    const num = Number(cleaned.replace(',', '.'))
    setFriends((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, amount: Number.isNaN(num) ? 0 : num } : f,
      ),
    )
  }

  const handleAddFriend = () => {
    const name = newName.trim().slice(0, 12)
    if (!name) return
    const cleanedAmt = String(newAmount).replace(/[^0-9.,-]/g, '').slice(0, 8)
    const num = Number(cleanedAmt.replace(',', '.'))
    setFriends((prev) => [
      ...prev,
      {
        id: prev.length ? Math.max(...prev.map((f) => f.id)) + 1 : 1,
        name,
        amount: Number.isNaN(num) ? 0 : num,
      },
    ])
    setNewName('')
    setNewAmount('')
  }

  const handleRemoveFriend = (id) => {
    setFriends((prev) => prev.filter((f) => f.id !== id))
  }

  const downloadAsImage = async () => {
    if (!transfersRef.current) return
    try {
      // Crear un contenedor temporal con toda la información
      const tempDiv = document.createElement('div')
      tempDiv.style.cssText = `
        background: #020617;
        color: #e5e7eb;
        padding: 1.5rem;
        borderRadius: '1rem';
        fontFamily: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        maxWidth: 600px;
      `

      // Encabezado
      const header = document.createElement('div')
      header.style.cssText = `
        fontSize: 1.5rem;
        fontWeight: 700;
        marginBottom: 1rem;
        textAlign: center;
        color: #38bdf8;
      `
      header.textContent = 'Divisor de Gastos'

      // Resumen total
      const summary = document.createElement('div')
      summary.style.cssText = `
        marginBottom: 1.5rem;
        padding: 1rem;
        background: rgba(56,189,248,0.1);
        borderRadius: 0.5rem;
        border: 1px solid rgba(56,189,248,0.3);
      `

      const totalLabel = document.createElement('div')
      totalLabel.style.cssText = 'fontSize: 0.9rem; color: #9ca3af; marginBottom: 0.25rem;'
      totalLabel.textContent = 'Total gastado'

      const totalAmount = document.createElement('div')
      totalAmount.style.cssText = 'fontSize: 1.3rem; fontWeight: 700; color: #4ade80;'
      totalAmount.textContent = `$${total.toFixed(2)}`

      summary.appendChild(totalLabel)
      summary.appendChild(totalAmount)

      // Detalles de lo que pagó cada uno
      const detailsTitle = document.createElement('div')
      detailsTitle.style.cssText = `
        fontSize: 1rem;
        fontWeight: 700;
        marginBottom: 0.75rem;
        color: #e5e7eb;
      `
      detailsTitle.textContent = 'Detalle de pagos'

      const detailsList = document.createElement('ul')
      detailsList.style.cssText = `
        listStyle: none;
        padding: 0;
        margin: 0 0 1.5rem 0;
      `

      friends.forEach((friend) => {
        const li = document.createElement('li')
        li.style.cssText = `
          padding: 0.5rem;
          marginBottom: 0.25rem;
          borderRadius: 0.4rem;
          background: #111827;
          fontSize: 0.9rem;
          whiteSpace: nowrap;
          overflow: hidden;
          textOverflow: ellipsis;
        `
        li.innerHTML = `
          <span style="color: #38bdf8; fontWeight: 600;">${friend.name}</span>
          <span style="color: #e5e7eb; margin: 0 0.5rem;"></span>
          <span style="color: #4ade80; fontWeight: 600;">$${friend.amount.toFixed(2)}</span>
        `
        detailsList.appendChild(li)
      })

      // Ajustes necesarios (lo que ya estaba)
      const adjustmentsTitle = document.createElement('div')
      adjustmentsTitle.style.cssText = `
        fontSize: 1rem;
        fontWeight: 700;
        marginBottom: 0.75rem;
        color: #e5e7eb;
      `
      adjustmentsTitle.textContent = 'Ajustes necesarios'

      const adjustmentsList = document.createElement('ul')
      adjustmentsList.style.cssText = `
        listStyle: none;
        padding: 0;
        margin: 0;
      `

      if (transfers.length === 0) {
        const li = document.createElement('li')
        li.style.cssText = 'color: #9ca3af; fontSize: 0.9rem; padding: 0.5rem;'
        li.textContent = 'Todos están equilibrados'
        adjustmentsList.appendChild(li)
      } else {
        transfers.forEach((transfer) => {
          const li = document.createElement('li')
          li.style.cssText = `
            padding: 0.5rem;
            marginBottom: 0.25rem;
            borderRadius: 0.4rem;
            background: #111827;
            fontSize: 0.9rem;
          `
          li.innerHTML = `
            <span style="color: #f97373; fontWeight: 600; marginRight: 0.25rem;">${transfer.from}</span>
            <span style="color: #e5e7eb;"> le paga </span>
            <span style="color: #4ade80; fontWeight: 600; margin: 0 0.25rem;">$${transfer.amount.toFixed(2)}</span>
            <span style="color: #e5e7eb;"> a </span>
            <span style="color: #38bdf8; fontWeight: 600; marginLeft: 0.25rem;">${transfer.to}</span>
          `
          adjustmentsList.appendChild(li)
        })
      }

      tempDiv.appendChild(header)
      tempDiv.appendChild(summary)
      tempDiv.appendChild(detailsTitle)
      tempDiv.appendChild(detailsList)
      tempDiv.appendChild(adjustmentsTitle)
      tempDiv.appendChild(adjustmentsList)

      document.body.appendChild(tempDiv)

      const canvas = await html2canvas(tempDiv, {
        backgroundColor: '#020617',
        scale: 2,
      })

      document.body.removeChild(tempDiv)

      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/jpeg', 0.95)
      link.download = `divisor-gastos-${new Date().toISOString().split('T')[0]}.jpg`
      link.click()
    } catch (error) {
      alert('Error al generar la imagen: ' + error.message)
    }
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f172a',
        color: '#e5e7eb',
        display: 'flex',
        justifyContent: 'center',
        padding: isMobile ? '1rem' : '2rem',
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '900px',
          background: '#020617',
          borderRadius: '1rem',
          padding: isMobile ? '1rem' : '1.75rem',
          boxShadow: '0 25px 50px -12px rgba(15,23,42,0.9)',
          border: '1px solid rgba(148,163,184,0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem', gap: isMobile ? '0.5rem' : '1rem', flexDirection: isMobile ? 'column' : 'row' }}>
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: isMobile ? '1.3rem' : '1.8rem',
                fontWeight: 700,
                marginBottom: '0.5rem',
              }}
            >
              Divisor de gastos
            </h1>
          </div>
          <button
            onClick={() => setShowHome(true)}
            style={{
              background: 'transparent',
              border: '1px solid #6b7280',
              borderRadius: '0.5rem',
              padding: isMobile ? '0.4rem 0.75rem' : '0.5rem 1rem',
              color: '#9ca3af',
              cursor: 'pointer',
              fontSize: isMobile ? '0.75rem' : '0.85rem',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              minHeight: '36px',
              touchAction: 'manipulation',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#1f2937'
              e.target.style.color = '#e5e7eb'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent'
              e.target.style.color = '#9ca3af'
            }}
          >
            ← Volver
          </button>
        </div>
        <p style={{ color: '#9ca3af', marginBottom: '1.5rem', fontSize: isMobile ? '0.85rem' : '1rem' }}>
          Ingresa cuánto pagó cada uno. La app calcula cuánto debe pagar/recibir cada uno y propone las transferencias mínimas.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 110px 64px' : '2fr 1fr auto',
            gap: '0.5rem',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <div
            style={{
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              color: '#6b7280',
            }}
          >
            Amigo
          </div>
          <div
            style={{
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              color: '#6b7280',
            }}
          >
            Monto pagado
          </div>
          <div />
          {friends.map((f) => (
            <React.Fragment key={f.id}>
              <input
                value={f.name}
                maxLength={12}
                onChange={(e) =>
                  setFriends((prev) =>
                    prev.map((x) =>
                      x.id === f.id ? { ...x, name: e.target.value.slice(0, 12) } : x,
                    ),
                  )
                }
                style={{
                  background: '#020617',
                  borderRadius: '0.5rem',
                  border: '1px solid #1f2937',
                  padding: isMobile ? '0.4rem 0.5rem' : '0.5rem 0.75rem',
                  color: '#e5e7eb',
                  fontSize: isMobile ? '0.85rem' : '1rem',
                  minHeight: '44px',
                  boxSizing: 'border-box',
                  touchAction: 'manipulation',
                  width: '100%',
                }}
              />
              <input
                type="text"
                value={String(f.amount).replace('.', ',')}
                maxLength={8}
                onChange={(e) => handleAmountChange(f.id, e.target.value.slice(0, 8))}
                inputMode="decimal"
                style={{
                  background: '#020617',
                  borderRadius: '0.5rem',
                  border: '1px solid #1f2937',
                  padding: isMobile ? '0.4rem 0.5rem' : '0.5rem 0.75rem',
                  color: '#e5e7eb',
                  fontSize: isMobile ? '0.85rem' : '1rem',
                  minHeight: '44px',
                  boxSizing: 'border-box',
                  touchAction: 'manipulation',
                  width: '100%',
                  textAlign: 'right',
                }}
              />
              <button
                type="button"
                onClick={() => handleRemoveFriend(f.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#f97373',
                  cursor: 'pointer',
                  fontSize: isMobile ? '0.75rem' : '0.85rem',
                  minHeight: '36px',
                  touchAction: 'manipulation',
                  padding: '0.25rem 0.5rem',
                }}
              >
                Eliminar
              </button>
            </React.Fragment>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr auto',
            gap: '0.5rem',
            alignItems: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <input
            placeholder="Nombre"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{
              background: '#020617',
              borderRadius: '0.5rem',
              border: '1px solid #1f2937',
              padding: isMobile ? '0.4rem 0.5rem' : '0.5rem 0.75rem',
              color: '#e5e7eb',
              fontSize: isMobile ? '0.85rem' : '1rem',
              minHeight: '44px',
              boxSizing: 'border-box',
              touchAction: 'manipulation',
            }}
          />
          <input
            placeholder="Monto"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            style={{
              background: '#020617',
              borderRadius: '0.5rem',
              border: '1px solid #1f2937',
              padding: isMobile ? '0.4rem 0.5rem' : '0.5rem 0.75rem',
              color: '#e5e7eb',
              fontSize: isMobile ? '0.85rem' : '1rem',
              minHeight: '44px',
              boxSizing: 'border-box',
              touchAction: 'manipulation',
              display: isMobile ? 'none' : 'block',
            }}
          />
          <button
            type="button"
            onClick={handleAddFriend}
            style={{
              background:
                'linear-gradient(135deg, rgba(56,189,248,0.95), rgba(129,140,248,0.95))',
              borderRadius: '999px',
              border: 'none',
              padding: isMobile ? '0.5rem 1rem' : '0.55rem 1rem',
              color: '#020617',
              fontWeight: 600,
              fontSize: '0.85rem',
              minHeight: '44px',
              touchAction: 'manipulation',
              cursor: 'pointer',
            }}
          >
            Añadir amigo
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: isMobile ? '0.75rem' : '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              background:
                'radial-gradient(circle at top left, rgba(56,189,248,0.25), transparent 55%), #020617',
              borderRadius: '0.75rem',
              padding: isMobile ? '0.75rem' : '1rem',
              border: '1px solid rgba(56,189,248,0.4)',
            }}
          >
            <div style={{ fontSize: isMobile ? '0.75rem' : '0.9rem', color: '#9ca3af' }}>
              Total gastado
            </div>
            <div style={{ fontSize: isMobile ? '1rem' : '1.4rem', fontWeight: 700, marginTop: '0.25rem' }}>
              ${total.toFixed(2)}
            </div>
          </div>
          <div
            style={{
              background:
                'radial-gradient(circle at top right, rgba(129,140,248,0.25), transparent 55%), #020617',
              borderRadius: '0.75rem',
              padding: isMobile ? '0.75rem' : '1rem',
              border: '1px solid rgba(129,140,248,0.4)',
            }}
          >
            <div style={{ fontSize: isMobile ? '0.75rem' : '0.9rem', color: '#9ca3af' }}>
              Por persona
            </div>
            <div style={{ fontSize: isMobile ? '1rem' : '1.4rem', fontWeight: 700, marginTop: '0.25rem' }}>
              ${Number.isNaN(perPerson) ? '0.00' : perPerson.toFixed(2)}
            </div>
          </div>
        </div>

        <div ref={transfersRef} style={{ paddingBottom: '1rem' }}>
          <h2
            style={{
              fontSize: isMobile ? '0.95rem' : '1.1rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
            }}
          >
            Ajustes necesarios
          </h2>
          {transfers.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: isMobile ? '0.85rem' : '1rem' }}>
              No hay transferencias necesarias. Todos están equilibrados.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {transfers.map((t, idx) => (
                <li
                  key={idx}
                  style={{
                    padding: isMobile ? '0.4rem 0.5rem' : '0.5rem 0.75rem',
                    marginBottom: '0.25rem',
                    borderRadius: '0.5rem',
                    background: '#020617',
                    border: '1px solid #111827',
                    fontSize: isMobile ? '0.8rem' : '0.95rem',
                    minHeight: isMobile ? '36px' : 'auto',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{ color: '#f97373', fontWeight: 600, marginRight: '0.25rem' }}
                  >
                    {t.from}
                  </span>
                  <span style={{ color: '#e5e7eb' }}> le paga </span>
                  <span
                    style={{ color: '#4ade80', fontWeight: 600, margin: '0 0.25rem' }}
                  >
                    ${t.amount.toFixed(2)}
                  </span>
                  <span style={{ color: '#e5e7eb' }}> a </span>
                  <span
                    style={{ color: '#38bdf8', fontWeight: 600, marginLeft: '0.25rem' }}
                  >
                    {t.to}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {transfers.length > 0 && (
          <button
            onClick={downloadAsImage}
            style={{
              background:
                'linear-gradient(135deg, rgba(168,85,247,0.95), rgba(139,92,246,0.95))',
              borderRadius: '0.5rem',
              border: 'none',
              padding: isMobile ? '0.5rem 1rem' : '0.65rem 1.5rem',
              color: '#020617',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              marginTop: '1rem',
              width: '100%',
              minHeight: '44px',
              touchAction: 'manipulation',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.02)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)'
            }}
          >
            📸 Descargar para WhatsApp
          </button>
        )}
      </div>
    </div>
  )
}

