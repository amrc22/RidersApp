<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import Swal from 'sweetalert2';
import { api } from './api';

const riders = ref([]);
const allRiders = ref([]);
const summary = ref([]);
const evaluation = ref(null);
const loading = ref(false);
const loadingEvaluation = ref(false);
const showEvaluationModal = ref(false);
const showCreateModal = ref(false);
const showCreateRiderModal = ref(false);
const deliveryFormError = ref('');
const riderFormError = ref('');
const requestError = ref('');
const creatingDelivery = ref(false);
const creatingRider = ref(false);

const filters = reactive({
  zone: '',
  category: '',
  status: '',
});

const deliveryForm = reactive({
  riderId: '',
  description: '',
  amount: '',
  status: 'pendiente',
});

const newRiderForm = reactive({
  name: '',
  email: '',
  phone: '',
  zone: '',
  category: 'Rookie',
});

const categoryTone = {
  Rookie: 'rookie',
  'Semi-Pro': 'semi',
  Pro: 'pro',
  Elite: 'elite',
};

const statusTone = {
  pendiente: 'pending',
  en_curso: 'progress',
  completada: 'done',
  cancelada: 'cancelled',
};

const zones = computed(() => [...new Set(allRiders.value.map((rider) => rider.zone))]);
const categories = computed(() => [
  ...new Set(allRiders.value.map((rider) => rider.currentCategory.name)),
]);
const statuses = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_curso', label: 'En curso' },
  { value: 'completada', label: 'Completada' },
  { value: 'cancelada', label: 'Cancelada' },
];

const totalCompleted = computed(() =>
  riders.value.reduce((sum, rider) => sum + rider.completedDeliveriesLast30Days, 0),
);

const averageScore = computed(() => {
  const values = riders.value
    .map((rider) => rider.averageRatingLast30Days)
    .filter((value) => value !== null);
  if (!values.length) {
    return '0.0';
  }
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  return avg.toFixed(2);
});

const allFilterLabels = {
  zone: 'Todas',
  category: 'Todas',
  status: 'Todos',
};

function showSuccessAlert(title, text) {
  return Swal.fire({
    icon: 'success',
    title,
    text,
    confirmButtonColor: '#ff6b35',
  });
}

function showErrorAlert(title, text) {
  return Swal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonColor: '#ff6b35',
  });
}

function showWarningAlert(title, text) {
  return Swal.fire({
    icon: 'warning',
    title,
    text,
    confirmButtonColor: '#ff6b35',
  });
}

async function loadData() {
  loading.value = true;
  requestError.value = '';

  try {
    const [ridersData, allRidersData, summaryData] = await Promise.all([
      api.listRiders(filters),
      api.listRiders({}),
      api.getZonesSummary(),
    ]);
    riders.value = ridersData;
    allRiders.value = allRidersData;
    summary.value = summaryData;
  } catch (error) {
    requestError.value = error.message;
  } finally {
    loading.value = false;
  }
}

async function openEvaluation(rider) {
  loadingEvaluation.value = true;
  showEvaluationModal.value = true;
  evaluation.value = null;

  try {
    evaluation.value = await api.getRiderEvaluation(rider.id);
  } catch (error) {
    requestError.value = error.message;
    showEvaluationModal.value = false;
  } finally {
    loadingEvaluation.value = false;
  }
}

function openCreateDeliveryModal() {
  deliveryFormError.value = '';
  const defaultRider = allRiders.value[0];
  deliveryForm.riderId = defaultRider?.id ? String(defaultRider.id) : '';
  deliveryForm.description = '';
  deliveryForm.amount = '';
  deliveryForm.status = 'pendiente';
  showCreateModal.value = true;
}

function openCreateRiderModal() {
  riderFormError.value = '';
  newRiderForm.name = '';
  newRiderForm.email = '';
  newRiderForm.phone = '';
  newRiderForm.zone = zones.value[0] ?? '';
  newRiderForm.category = 'Rookie';
  showCreateRiderModal.value = true;
}

async function submitDelivery() {
  deliveryFormError.value = '';
  creatingDelivery.value = true;

  try {
    if (!deliveryForm.riderId) {
      const message = 'Debes seleccionar un rider para registrar el pedido.';
      deliveryFormError.value = message;
      await showWarningAlert('Falta un dato', message);
      creatingDelivery.value = false;
      return;
    }

    if (!deliveryForm.description.trim()) {
      const message = 'Debes ingresar la descripcion del pedido.';
      deliveryFormError.value = message;
      await showWarningAlert('Falta un dato', message);
      creatingDelivery.value = false;
      return;
    }

    if (!deliveryForm.amount || Number(deliveryForm.amount) <= 0) {
      const message = 'Debes ingresar un monto valido mayor a 0.';
      deliveryFormError.value = message;
      await showWarningAlert('Monto invalido', message);
      creatingDelivery.value = false;
      return;
    }

    await api.createDelivery({
      riderId: Number(deliveryForm.riderId),
      description: deliveryForm.description.trim(),
      amount: Number(deliveryForm.amount),
    });
    showCreateModal.value = false;
    await loadData();
    await showSuccessAlert('Entrega registrada', 'El pedido se guardo correctamente.');
  } catch (error) {
    deliveryFormError.value = error.message;
    await showErrorAlert('No se pudo registrar', error.message);
  } finally {
    creatingDelivery.value = false;
  }
}

async function submitRider() {
  riderFormError.value = '';
  creatingRider.value = true;

  try {
    if (!newRiderForm.name.trim()) {
      const message = 'Debes ingresar el nombre del rider.';
      riderFormError.value = message;
      await showWarningAlert('Falta un dato', message);
      creatingRider.value = false;
      return;
    }

    if (!newRiderForm.email.trim()) {
      const message = 'Debes ingresar el correo del rider.';
      riderFormError.value = message;
      await showWarningAlert('Falta un dato', message);
      creatingRider.value = false;
      return;
    }

    if (!newRiderForm.phone.trim()) {
      const message = 'Debes ingresar el telefono del rider.';
      riderFormError.value = message;
      await showWarningAlert('Falta un dato', message);
      creatingRider.value = false;
      return;
    }

    if (!newRiderForm.zone.trim()) {
      const message = 'Debes ingresar la zona del rider.';
      riderFormError.value = message;
      await showWarningAlert('Falta un dato', message);
      creatingRider.value = false;
      return;
    }

    await api.createRider({
      name: newRiderForm.name.trim(),
      email: newRiderForm.email.trim(),
      phone: newRiderForm.phone.trim(),
      zone: newRiderForm.zone.trim(),
      category: newRiderForm.category,
    });
    showCreateRiderModal.value = false;
    await loadData();
    await showSuccessAlert('Rider registrado', 'El rider se creo correctamente.');
  } catch (error) {
    riderFormError.value = error.message;
    await showErrorAlert('No se pudo registrar', error.message);
  } finally {
    creatingRider.value = false;
  }
}

function currency(value) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

function date(value) {
  return new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function statusLabel(status) {
  return status.replace('_', ' ');
}

async function applyFilter(filterKey, value, event) {
  filters[filterKey] = value;
  event?.currentTarget?.closest('details')?.removeAttribute('open');
  await loadData();
}

onMounted(loadData);
</script>

<template>
  <main class="page-shell">
    <div class="hero-label-wrap">
      <p class="eyebrow hero-label">RidersApp Operations</p>
    </div>

    <section class="hero-card">
      <div>
        <h1>Control de riders, entregas y comisiones</h1>
      </div>
      <div class="hero-actions">
        <button class="primary-button" type="button" @click="openCreateDeliveryModal">
          Registrar pedido
        </button>
        <button class="ghost-button" type="button" @click="openCreateRiderModal">
          Agregar rider
        </button>
      </div>
    </section>

    <section class="stats-grid">
      <article class="stat-card">
        <span>Riders visibles</span>
        <strong>{{ riders.length }}</strong>
      </article>
      <article class="stat-card">
        <span>Entregas completadas</span>
        <strong>{{ totalCompleted }}</strong>
      </article>
      <article class="stat-card">
        <span>Rating promedio</span>
        <strong>{{ averageScore }}</strong>
      </article>
    </section>

    <section class="panel-card">
      <p v-if="requestError" class="error-banner">{{ requestError }}</p>

      <div v-if="loading" class="empty-state">Cargando riders...</div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Rider</th>
              <th>
                <details class="table-filter-dropdown">
                  <summary>Zona</summary>
                  <div class="table-filter-menu">
                    <button
                      class="table-filter-option"
                      :class="{ active: filters.zone === '' }"
                      type="button"
                      @click="applyFilter('zone', '', $event)"
                    >
                      {{ allFilterLabels.zone }}
                    </button>
                    <button
                      v-for="zone in zones"
                      :key="zone"
                      class="table-filter-option"
                      :class="{ active: filters.zone === zone }"
                      type="button"
                      @click="applyFilter('zone', zone, $event)"
                    >
                      {{ zone }}
                    </button>
                  </div>
                </details>
              </th>
              <th>
                <details class="table-filter-dropdown">
                  <summary>Categoria</summary>
                  <div class="table-filter-menu">
                    <button
                      class="table-filter-option"
                      :class="{ active: filters.category === '' }"
                      type="button"
                      @click="applyFilter('category', '', $event)"
                    >
                      {{ allFilterLabels.category }}
                    </button>
                    <button
                      v-for="category in categories"
                      :key="category"
                      class="table-filter-option"
                      :class="{ active: filters.category === category }"
                      type="button"
                      @click="applyFilter('category', category, $event)"
                    >
                      {{ category }}
                    </button>
                  </div>
                </details>
              </th>
              <th>
                <details class="table-filter-dropdown">
                  <summary>Estado pedido</summary>
                  <div class="table-filter-menu">
                    <button
                      class="table-filter-option"
                      :class="{ active: filters.status === '' }"
                      type="button"
                      @click="applyFilter('status', '', $event)"
                    >
                      {{ allFilterLabels.status }}
                    </button>
                    <button
                      v-for="status in statuses"
                      :key="status.value"
                      class="table-filter-option"
                      :class="{ active: filters.status === status.value }"
                      type="button"
                      @click="applyFilter('status', status.value, $event)"
                    >
                      {{ status.label }}
                    </button>
                  </div>
                </details>
              </th>
              <th>Entregas 30 dias</th>
              <th>Rating promedio</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rider in riders" :key="rider.id" @click="openEvaluation(rider)">
              <td>
                <strong>{{ rider.name }}</strong>
                <small>{{ rider.email }}</small>
              </td>
              <td>{{ rider.zone }}</td>
              <td>
                <span class="badge" :class="categoryTone[rider.currentCategory.name]">
                  {{ rider.currentCategory.name }}
                </span>
              </td>
              <td>
                <span
                  v-if="rider.latestDelivery"
                  class="badge"
                  :class="statusTone[rider.latestDelivery.status]"
                >
                  {{ statusLabel(rider.latestDelivery.status) }}
                </span>
                <span v-else>Sin pedido</span>
              </td>
              <td>{{ rider.completedDeliveriesLast30Days }}</td>
              <td>{{ rider.averageRatingLast30Days ?? 'Sin rating' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="showEvaluationModal" class="modal-backdrop" @click.self="showEvaluationModal = false">
      <article class="modal-card large">
        <header class="modal-head">
          <div>
            <p class="eyebrow">Evaluacion del rider</p>
            <h2 v-if="evaluation">{{ evaluation.rider.name }}</h2>
          </div>
          <button
            class="modal-close-button"
            type="button"
            aria-label="Cerrar modal"
            @click="showEvaluationModal = false"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div v-if="loadingEvaluation" class="empty-state">Cargando evaluacion...</div>
        <template v-else-if="evaluation">
          <section class="evaluation-grid">
            <article class="metric-card">
              <span>Zona</span>
              <strong>{{ evaluation.rider.zone }}</strong>
            </article>
            <article class="metric-card">
              <span>Entregas completadas</span>
              <strong>{{ evaluation.completedDeliveriesLast30Days }}</strong>
            </article>
            <article class="metric-card">
              <span>Rating promedio</span>
              <strong>{{ evaluation.averageRatingLast30Days ?? 'Sin rating' }}</strong>
            </article>
            <article class="metric-card">
              <span>Comisiones generadas</span>
              <strong>{{ currency(evaluation.commissionsGeneratedLast30Days) }}</strong>
            </article>
          </section>

          <section class="category-comparison">
            <div>
              <p>Categoria actual</p>
              <span class="badge" :class="categoryTone[evaluation.currentCategory.name]">
                {{ evaluation.currentCategory.name }}
              </span>
            </div>
          </section>

          <section>
            <h3>Entregas completadas del periodo</h3>
            <div class="deliveries-list">
              <article
                v-for="delivery in evaluation.completedDeliveries"
                :key="delivery.id"
                class="delivery-item"
              >
                <div>
                  <strong>{{ delivery.description }}</strong>
                  <small>{{ date(delivery.completedAt) }}</small>
                </div>
                <div class="delivery-meta">
                  <span>{{ currency(delivery.amount) }}</span>
                  <span>Rating {{ delivery.customerRating }}</span>
                </div>
              </article>
            </div>
          </section>
        </template>
      </article>
    </div>

    <div v-if="showCreateModal" class="modal-backdrop" @click.self="showCreateModal = false">
      <article class="modal-card">
        <header class="modal-head">
          <div>
            <p class="eyebrow">Nueva entrega</p>
            <h2>Registrar pedido</h2>
          </div>
          <button
            class="modal-close-button"
            type="button"
            aria-label="Cerrar modal"
            @click="showCreateModal = false"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <form class="form-layout" @submit.prevent="submitDelivery">
          <label>
            Rider
            <select v-model="deliveryForm.riderId" required>
              <option disabled value="">Selecciona un rider</option>
              <option v-for="rider in allRiders" :key="rider.id" :value="String(rider.id)">
                {{ rider.name }} · {{ rider.zone }} · {{ rider.currentCategory.name }}
              </option>
            </select>
            <small>Selecciona un rider existente para asociar la entrega.</small>
          </label>
          <label>
            Estado
            <select v-model="deliveryForm.status" disabled>
              <option value="pendiente">pendiente</option>
            </select>
            <small>El pedido nuevo siempre inicia en pendiente segun el flujo definido.</small>
          </label>

          <label>
            Descripcion
            <input
              v-model="deliveryForm.description"
              type="text"
              required
              maxlength="255"
              placeholder="Ej. Combo familiar pollo"
            />
          </label>

          <label>
            Monto USD
            <input
              v-model="deliveryForm.amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              placeholder="12.50"
            />
          </label>

          <p v-if="deliveryFormError" class="error-banner">{{ deliveryFormError }}</p>

          <button class="primary-button" type="submit" :disabled="creatingDelivery">
            {{ creatingDelivery ? 'Registrando...' : 'Guardar entrega' }}
          </button>
        </form>
      </article>
    </div>

    <div
      v-if="showCreateRiderModal"
      class="modal-backdrop"
      @click.self="showCreateRiderModal = false"
    >
      <article class="modal-card">
        <header class="modal-head">
          <div>
            <p class="eyebrow">Nuevo rider</p>
            <h2>Agregar rider</h2>
          </div>
          <button
            class="modal-close-button"
            type="button"
            aria-label="Cerrar modal"
            @click="showCreateRiderModal = false"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <form class="form-layout" @submit.prevent="submitRider">
          <div class="new-rider-grid">
            <label>
              Nombre
              <input
                v-model="newRiderForm.name"
                type="text"
                required
                maxlength="120"
                placeholder="Nombre del rider"
              />
            </label>
            <label>
              Correo
              <input
                v-model="newRiderForm.email"
                type="email"
                required
                maxlength="180"
                placeholder="correo@ejemplo.com"
              />
            </label>
            <label>
              Telefono
              <input
                v-model="newRiderForm.phone"
                type="text"
                required
                maxlength="20"
                placeholder="0991234567"
              />
            </label>
            <label>
              Zona
              <input
                v-model="newRiderForm.zone"
                type="text"
                required
                maxlength="80"
                placeholder="Zona"
              />
            </label>
            <label class="new-rider-full">
              Categoria inicial
              <input v-model="newRiderForm.category" type="text" disabled />
            </label>
          </div>

          <small>El rider se registra por separado y luego queda disponible para pedidos.</small>
          <p v-if="riderFormError" class="error-banner">{{ riderFormError }}</p>

          <button class="primary-button" type="submit" :disabled="creatingRider">
            {{ creatingRider ? 'Registrando...' : 'Guardar rider' }}
          </button>
        </form>
      </article>
    </div>
  </main>
</template>
