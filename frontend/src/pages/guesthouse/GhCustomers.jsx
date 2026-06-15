import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  UserPlus, Mail, Phone, Edit2, Trash2, X, Calendar, MapPin,
  ChevronRight, Wallet, BedDouble, Users, FileText, XCircle,
} from 'lucide-react';
import CancelStayModal from '../../components/guesthouse/CancelStayModal';
import { canCancelGhStay } from '../../utils/ghStay';
import client from '../../api/client';
import { getGuestHouseDaily } from '../../api/guesthouse';
import toast from 'react-hot-toast';
import AppLoader from '../../components/AppLoader';
import { customerDisplayName, customerInitials, buildCustomerPayload, validateGhCustomerForm } from '../../utils/customer';
import { formatRs, formatCollectDuePKR, hasCollectDue } from '../../utils/currency';
import { usePermissions } from '../../hooks/usePermissions';
import { useGhPageVisibility } from '../../context/GhPageVisibilityContext';
import { GH_MODULE_KEYS } from '../../constants/ghPages';
import SearchInput from '../../components/SearchInput';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { todayISO } from '../../utils/ghDate';
import CnicScannerPanel from '../../components/guesthouse/CnicScannerPanel';
import { resolveGuestFromIdScan } from '../../utils/idCardCustomer';
import '../../styles/dashboard.css';
import './gh-customers.css';
import './gh-records.css';

const formatStayDates = (checkIn, checkOut) => {
  try {
    return `${format(parseISO(checkIn), 'dd MMM')} → ${format(parseISO(checkOut), 'dd MMM yyyy')}`;
  } catch {
    return `${checkIn || '-'} → ${checkOut || '-'}`;
  }
};

const emptyCustomer = {
  full_name: '',
  cnic: '',
  email: '',
  phone: '',
  address: '',
};

export default function GhCustomers() {
  const { canOperate, canManage, canAccessPayments, canCancelStay } = usePermissions();
  const { isModuleVisible } = useGhPageVisibility();
  const showIdScanner = isModuleVisible(GH_MODULE_KEYS.ID_SCANNER);
  const [cancelTarget, setCancelTarget] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { customerId: customerIdParam } = useParams();
  const selectedId = customerIdParam ? Number(customerIdParam) : null;

  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewTab, setViewTab] = useState('all');
  const [dailyDate, setDailyDate] = useState(todayISO());
  const [dailyData, setDailyData] = useState(null);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(emptyCustomer);
  const [formErrors, setFormErrors] = useState({});
  const [scanProcessing, setScanProcessing] = useState(false);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await client.get('/customers/');
      setCustomers(response.data.results || response.data || []);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSummary = useCallback(async (customerId) => {
    if (!customerId) return;
    setSummaryLoading(true);
    try {
      const res = await client.get(`/customers/${customerId}/summary/`, {
        params: { app: 'guesthouse' },
      });
      setSummary(res.data);
    } catch {
      toast.error('Failed to load customer details');
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => { fetchCustomers(); }, []);

  useEffect(() => {
    if (viewTab !== 'daily') return undefined;
    let active = true;
    setDailyLoading(true);
    getGuestHouseDaily({ date: dailyDate })
      .then((data) => { if (active) setDailyData(data); })
      .catch(() => { if (active) toast.error('Failed to load daily data'); })
      .finally(() => { if (active) setDailyLoading(false); });
    return () => { active = false; };
  }, [viewTab, dailyDate]);

  useEffect(() => {
    const id = location.state?.selectedCustomerId;
    if (id) {
      navigate(`/gh/customers/${id}`, { replace: true, state: {} });
    }
  }, [location.state?.selectedCustomerId, navigate]);

  useEffect(() => {
    if (location.state?.openCreate && canOperate) {
      handleOpenFormModal();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.openCreate, canOperate, navigate, location.pathname]);

  useEffect(() => {
    if (selectedId) fetchSummary(selectedId);
    else setSummary(null);
  }, [selectedId, fetchSummary]);

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const name = customerDisplayName(c).toLowerCase();
      return (
        name.includes(q)
        || (c.phone || '').includes(q)
        || (c.email || '').toLowerCase().includes(q)
        || (c.cnic || '').includes(q)
      );
    });
  }, [customers, searchQuery]);

  const metrics = useMemo(() => {
    const withDue = customers.filter((c) => hasCollectDue(c.outstanding_balance));
    const totalDue = customers.reduce((s, c) => s + (Number(c.outstanding_balance) || 0), 0);
    return { total: customers.length, withDue: withDue.length, totalDue };
  }, [customers]);

  const handleOpenFormModal = (customer = null) => {
    if (!canOperate) {
      toast.error('You do not have permission to modify customers.');
      return;
    }
    if (customer) {
      setCurrentCustomer({
        ...customer,
        full_name: customer.full_name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
        cnic: customer.cnic || '',
        email: customer.email || '',
      });
      setIsEditing(true);
    } else {
      setCurrentCustomer(emptyCustomer);
      setIsEditing(false);
    }
    setFormErrors({});
    setShowFormModal(true);
  };

  const updateCustomerField = (field, value) => {
    setCurrentCustomer((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleIdScan = async (parsed) => {
    if (scanProcessing || isEditing) return;
    setCurrentCustomer({ ...emptyCustomer });
    setFormErrors({});
    setScanProcessing(true);
    try {
      const result = await resolveGuestFromIdScan(parsed, { customers });
      if (result.status === 'invalid') {
        toast.error('Could not read ID card. Scan again.');
        return;
      }
      if (result.status === 'existing') {
        toast.success(`Guest found: ${customerDisplayName(result.customer)}`);
        setShowFormModal(false);
        await fetchCustomers();
        navigate(`/gh/customers/${result.customer.id}`);
        return;
      }
      if (result.status === 'created') {
        toast.success(`Guest saved: ${customerDisplayName(result.customer)}`);
        setShowFormModal(false);
        setFormErrors({});
        await fetchCustomers();
        navigate(`/gh/customers/${result.customer.id}`);
        return;
      }
      setCurrentCustomer({
        ...emptyCustomer,
        ...result.draft,
      });
      setFormErrors({});
      setShowFormModal(true);
      toast('ID card read — check fields and add phone if missing', { icon: 'ℹ️' });
    } catch {
      toast.error('Failed to process ID card');
    } finally {
      setScanProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateGhCustomerForm(currentCustomer);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fill all required fields.');
      return;
    }
    const payload = buildCustomerPayload(currentCustomer);
    try {
      if (isEditing) {
        await client.put(`/customers/${currentCustomer.id}/`, payload);
        toast.success('Customer updated');
        if (selectedId === currentCustomer.id) fetchSummary(selectedId);
      } else {
        const res = await client.post('/customers/', payload);
        toast.success('Customer added');
        navigate(`/gh/customers/${res.data.id}`);
      }
      setShowFormModal(false);
      setFormErrors({});
      fetchCustomers();
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const apiErrors = {};
        Object.entries(data).forEach(([key, val]) => {
          apiErrors[key] = Array.isArray(val) ? val[0] : String(val);
        });
        if (Object.keys(apiErrors).length > 0) {
          setFormErrors(apiErrors);
          toast.error(apiErrors[Object.keys(apiErrors)[0]] || 'Operation failed');
          return;
        }
      }
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!canManage) return;
    if (!window.confirm('Delete this customer?')) return;
    try {
      await client.delete(`/customers/${id}/`);
      toast.success('Customer deleted');
      if (selectedId === id) navigate('/gh/customers');
      fetchCustomers();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const selectedCustomer = summary?.customer || customers.find((c) => c.id === selectedId);

  return (
    <>
      <div className="animate-fade-in gh-cust-page">
        <div className="page-header">
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: '800', margin: 0 }}>Guest Directory</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>
              Manage guests, daily reservations, stay history, and balance due.
            </p>
          </div>
          {canOperate && (
            <div className="page-header__actions">
              <button type="button" className="btn-primary" onClick={() => handleOpenFormModal()}>
                <UserPlus size={18} /> Add Guest
              </button>
            </div>
          )}
        </div>

        <section className="dash-kpi-grid" style={{ marginBottom: '24px' }}>
          {viewTab === 'daily' && dailyData ? (
            <>
              <StatCard label="Today's reservations" value={dailyData.counts?.reservations || 0} icon={BedDouble} variant="primary" />
              <StatCard label="Check-ins today" value={dailyData.counts?.arrivals || 0} icon={Calendar} variant="info" />
              <StatCard label="Check-outs today" value={dailyData.counts?.departures || 0} icon={Calendar} variant="warning" />
              <StatCard label="In-house now" value={dailyData.counts?.in_house || 0} icon={Users} variant="success" />
            </>
          ) : (
            <>
              <StatCard label="Total guests" value={metrics.total} icon={Users} variant="primary" />
              <StatCard label="With balance due" value={metrics.withDue} icon={Wallet} variant={metrics.withDue > 0 ? 'warning' : 'info'} />
              <StatCard
                label="Outstanding total"
                value={metrics.totalDue}
                icon={Wallet}
                isCurrency
                showZeroAs00
                variant={metrics.totalDue > 0 ? 'danger' : 'success'}
                to={canAccessPayments ? '/gh/payments' : undefined}
              />
            </>
          )}
        </section>

        <div className="gh-records-tabs" style={{ marginBottom: '20px' }}>
          <button
            type="button"
            className={`gh-records-tab${viewTab === 'all' ? ' gh-records-tab--active' : ''}`}
            onClick={() => setViewTab('all')}
          >
            All guests
          </button>
          <button
            type="button"
            className={`gh-records-tab${viewTab === 'daily' ? ' gh-records-tab--active' : ''}`}
            onClick={() => setViewTab('daily')}
          >
            Daily view
          </button>
        </div>

        {viewTab === 'daily' ? (
          <div>
            <div className="gh-records-toolbar search-filter-bar" style={{ marginBottom: '20px' }}>
              <div className="gh-records-toolbar__date">
                <label htmlFor="daily-date" style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>
                  Select date
                </label>
                <input
                  id="daily-date"
                  type="date"
                  className="search-filter-bar__select"
                  value={dailyDate}
                  onChange={(e) => setDailyDate(e.target.value)}
                />
              </div>
            </div>

            {dailyLoading ? (
              <AppLoader inline message="Loading daily data…" />
            ) : (
              <>
                {[
                  { key: 'reservations', title: 'Active reservations', items: dailyData?.reservations },
                  { key: 'arrivals', title: 'Check-ins today', items: dailyData?.arrivals },
                  { key: 'in_house', title: 'In-house guests', items: dailyData?.in_house },
                  { key: 'departures', title: 'Check-outs today', items: dailyData?.departures },
                ].map((section) => (
                  <div key={section.key} className="gh-daily-section">
                    <h3 className="gh-daily-section__title">
                      {section.title} ({section.items?.length || 0})
                    </h3>
                    {!section.items?.length ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No records for this section.</p>
                    ) : (
                      <div className="gh-daily-grid">
                        {section.items.map((stay) => (
                          <button
                            key={`${section.key}-${stay.id}`}
                            type="button"
                            className="gh-daily-card"
                            onClick={() => navigate(`/gh/stays/${stay.id}`)}
                          >
                            <p style={{ margin: 0, fontWeight: '800', fontSize: '14px' }}>{stay.customer_name}</p>
                            <p style={{ margin: '4px 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                              {stay.booking_ref} · Room {stay.room_number}
                            </p>
                            <p style={{ margin: '4px 0', fontSize: '12px' }}>
                              {formatStayDates(stay.check_in, stay.check_out)}
                            </p>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                              <StatusBadge status={stay.status} />
                              <StatusBadge status={stay.payment_status} />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        ) : (
        <div className="gh-cust-layout">
          <div className="gh-cust-list-panel">
            <div className="search-filter-bar" style={{ marginBottom: '14px', padding: '12px 14px' }}>
              <div className="search-filter-bar__search" style={{ minWidth: '100%', flex: 1 }}>
                <SearchInput
                  variant="inset"
                  placeholder="Search name, phone, CNIC, email…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="gh-cust-empty">Loading guests…</div>
            ) : filteredCustomers.length === 0 ? (
              <EmptyState
                icon={Users}
                title={searchQuery ? 'No guests match your search' : 'No guests yet'}
                description={searchQuery ? 'Try a different search term.' : 'Add your first guest to start booking stays.'}
                action={
                  canOperate && !searchQuery ? (
                    <button type="button" className="btn-primary" onClick={() => handleOpenFormModal()} style={{ marginTop: 16 }}>
                      <UserPlus size={16} /> Add first guest
                    </button>
                  ) : null
                }
              />
            ) : (
              <>
                <p className="gh-cust-count">{filteredCustomers.length} guest{filteredCustomers.length !== 1 ? 's' : ''}</p>
                <div className="gh-cust-list">
                  {filteredCustomers.map((customer) => {
                    const active = selectedId === customer.id;
                    const due = Number(customer.outstanding_balance) || 0;
                    return (
                      <button
                        key={customer.id}
                        type="button"
                        className={`gh-cust-row${active ? ' gh-cust-row--active' : ''}`}
                        onClick={() => navigate(`/gh/customers/${customer.id}`)}
                      >
                        <span className="gh-cust-row__avatar">{customerInitials(customer)}</span>
                        <div className="gh-cust-row__body">
                          <p className="gh-cust-row__name">{customerDisplayName(customer)}</p>
                          <p className="gh-cust-row__phone">{customer.phone || '-'}</p>
                          <p className={`gh-cust-row__due ${hasCollectDue(due) ? 'gh-cust-row__due--warn' : 'gh-cust-row__due--ok'}`}>
                            Due: {formatCollectDuePKR(due)}
                          </p>
                        </div>
                        <ChevronRight size={18} color={active ? 'var(--primary)' : 'var(--icon-muted)'} />
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {selectedId ? (
            <div className="gh-cust-detail">
              {summaryLoading ? (
                <AppLoader inline className="app-loader--compact" message="Loading profile…" />
              ) : selectedCustomer ? (
                <>
                  <div className="gh-cust-detail__head">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <h3 className="gh-cust-detail__name">{customerDisplayName(selectedCustomer)}</h3>
                        <p className="gh-cust-detail__sub">Guest profile & stay history</p>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        {canOperate && (
                          <button type="button" className="btn-secondary" onClick={() => handleOpenFormModal(selectedCustomer)} title="Edit" style={{ padding: '8px 10px' }}>
                            <Edit2 size={16} />
                          </button>
                        )}
                        {canManage && (
                          <button type="button" onClick={() => handleDelete(selectedId)} title="Delete" style={{ padding: '8px 10px', background: 'transparent', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 8 }}>
                            <Trash2 size={16} />
                          </button>
                        )}
                        <button type="button" onClick={() => navigate('/gh/customers')} title="Close" style={{ padding: '8px 10px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 8 }}>
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="gh-cust-detail__body">
                    <div className="gh-cust-chips">
                      <span className="gh-cust-chip"><Phone size={14} /> {selectedCustomer.phone}</span>
                      <span className="gh-cust-chip"><Mail size={14} /> {selectedCustomer.email || 'No email'}</span>
                      {selectedCustomer.cnic && (
                        <span className="gh-cust-chip" style={{ fontFamily: 'monospace', fontSize: 12 }}>CNIC {selectedCustomer.cnic}</span>
                      )}
                      {selectedCustomer.address && (
                        <span className="gh-cust-chip"><MapPin size={14} /> {selectedCustomer.address}</span>
                      )}
                      <span className="gh-cust-chip">
                        <Calendar size={14} /> Joined {new Date(selectedCustomer.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="gh-cust-stats">
                      <div className="gh-cust-stat">
                        <p className="gh-cust-stat__label">Total stays</p>
                        <p className="gh-cust-stat__val">{summary?.stays_count ?? 0}</p>
                      </div>
                      <div className="gh-cust-stat">
                        <p className="gh-cust-stat__label">Balance due</p>
                        <p className={`gh-cust-stat__val${hasCollectDue(summary?.total_outstanding) ? ' gh-cust-stat__val--warn' : ''}`}>
                          {formatCollectDuePKR(summary?.total_outstanding)}
                        </p>
                      </div>
                    </div>

                    {canOperate && (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => navigate('/gh/book', { state: { prefillCustomer: selectedId } })}
                        style={{ width: '100%', marginBottom: 16, padding: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                      >
                        <FileText size={16} /> New stay booking
                      </button>
                    )}

                    <p className="gh-cust-stays-title"><BedDouble size={16} /> Stay history</p>

                    {!summary?.stays?.length ? (
                      <div className="gh-cust-empty">
                        <BedDouble size={32} style={{ opacity: 0.25, marginBottom: 8 }} />
                        <p style={{ margin: 0, fontWeight: 600 }}>No stays for this guest yet</p>
                        {canOperate && (
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={() => navigate('/gh/book', { state: { prefillCustomer: selectedId } })}
                            style={{ marginTop: 14 }}
                          >
                            Book a stay
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="gh-cust-stays">
                        {summary.stays.map((stay) => {
                          const due = stay.status === 'CANCELLED' ? 0 : (Number(stay.remaining_balance) || 0);
                          return (
                            <div
                              key={stay.id}
                              className="gh-cust-stay"
                              role="button"
                              tabIndex={0}
                              onClick={() => navigate(`/gh/stays/${stay.id}`)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  navigate(`/gh/stays/${stay.id}`);
                                }
                              }}
                            >
                              <div className="gh-cust-stay__top">
                                <div>
                                  <p className="gh-cust-stay__ref">{stay.booking_ref}</p>
                                  <p className="gh-cust-stay__room">Room {stay.room_number}</p>
                                  <p className="gh-cust-stay__dates">{formatStayDates(stay.check_in, stay.check_out)}</p>
                                </div>
                                <StatusBadge status={stay.status} />
                              </div>
                              <div className="gh-cust-stay__amounts">
                                <div>
                                  <p className="gh-cust-stay__amt-l">Total</p>
                                  <p className="gh-cust-stay__amt-v">{formatRs(stay.total_amount)}</p>
                                </div>
                                <div>
                                  <p className="gh-cust-stay__amt-l">Paid</p>
                                  <p className="gh-cust-stay__amt-v" style={{ color: '#166534' }}>{formatRs(stay.advance_paid)}</p>
                                </div>
                                <div>
                                  <p className="gh-cust-stay__amt-l">Due</p>
                                  <p className="gh-cust-stay__amt-v" style={{ color: hasCollectDue(due) ? '#b91c1c' : 'var(--text-muted)' }}>
                                    {formatCollectDuePKR(due)}
                                  </p>
                                </div>
                              </div>
                              {canAccessPayments && hasCollectDue(due) && (
                                <button
                                  type="button"
                                  className="btn-primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/gh/payments/new?stay=${stay.id}`);
                                  }}
                                  style={{ marginTop: 12, width: '100%', padding: 10, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 8 }}
                                >
                                  <Wallet size={14} /> Collect {formatCollectDuePKR(due)}
                                </button>
                              )}
                              {canCancelStay && canCancelGhStay(stay) && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCancelTarget(stay);
                                  }}
                                  style={{
                                    marginTop: 10,
                                    width: '100%',
                                    padding: 10,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    borderRadius: 8,
                                    background: '#fef2f2',
                                    color: '#b91c1c',
                                    border: '1px solid #fecaca',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <XCircle size={14} /> Cancel stay
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <div className="gh-cust-detail" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
              <EmptyState
                icon={Users}
                title="Select a guest"
                description="Choose a guest from the list to view their profile and stay history."
              />
            </div>
          )}
        </div>
        )}
      </div>

      {showFormModal && (
        <div className="gh-cust-modal-backdrop" onClick={() => setShowFormModal(false)}>
          <div className="gh-cust-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>{isEditing ? 'Edit Guest' : 'Add New Guest'}</h3>
              <button type="button" onClick={() => setShowFormModal(false)} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }} noValidate>
              {!isEditing && showIdScanner && (
                <CnicScannerPanel onScan={handleIdScan} disabled={scanProcessing} />
              )}
              <div className="form-grid-2">
                <div className="input-group">
                  <label>Full name <span style={{ color: '#b91c1c' }}>*</span></label>
                  <input
                    value={currentCustomer.full_name || ''}
                    onChange={(e) => updateCustomerField('full_name', e.target.value)}
                    placeholder="Guest full name"
                    aria-invalid={!!formErrors.full_name}
                  />
                  {formErrors.full_name && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#b91c1c', fontWeight: 600 }}>{formErrors.full_name}</p>}
                </div>
                <div className="input-group">
                  <label>CNIC <span style={{ color: '#b91c1c' }}>*</span></label>
                  <input
                    value={currentCustomer.cnic || ''}
                    onChange={(e) => updateCustomerField('cnic', e.target.value)}
                    placeholder="35202-1234567-9"
                    style={{ fontFamily: 'monospace' }}
                    aria-invalid={!!formErrors.cnic}
                  />
                  {formErrors.cnic && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#b91c1c', fontWeight: 600 }}>{formErrors.cnic}</p>}
                </div>
              </div>
              <div className="input-group">
                <label>Email <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
                <input
                  type="email"
                  value={currentCustomer.email || ''}
                  onChange={(e) => updateCustomerField('email', e.target.value)}
                  aria-invalid={!!formErrors.email}
                />
                {formErrors.email && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#b91c1c', fontWeight: 600 }}>{formErrors.email}</p>}
              </div>
              <div className="input-group">
                <label>Phone <span style={{ color: '#b91c1c' }}>*</span></label>
                <input
                  value={currentCustomer.phone}
                  onChange={(e) => updateCustomerField('phone', e.target.value)}
                  placeholder="0300 1234567"
                  aria-invalid={!!formErrors.phone}
                />
                {formErrors.phone && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#b91c1c', fontWeight: 600 }}>{formErrors.phone}</p>}
              </div>
              <div className="input-group">
                <label>Address <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
                <textarea value={currentCustomer.address || ''} onChange={(e) => updateCustomerField('address', e.target.value)} rows={2} style={{ width: '100%' }} />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: 13, fontWeight: 700 }}>
                {isEditing ? 'Save changes' : 'Add guest'}
              </button>
            </form>
          </div>
        </div>
      )}

      <CancelStayModal
        stay={cancelTarget}
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onCancelled={() => {
          if (selectedId) fetchSummary(selectedId);
          fetchCustomers();
        }}
      />
    </>
  );
}
