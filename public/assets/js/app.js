const API_URL = 'https://api-platform-project.onrender.com/api/products';
const LOGIN_URL = 'https://api-platform-project.onrender.com/api/login';
let authToken = null;

function actualizarVisibilidadApp() {
  const token = localStorage.getItem('jwt');
  const logueado = !!token;

  document.getElementById('logout-btn').style.display = logueado ? 'block' : 'none';
  document.getElementById('login-section').style.display = logueado ? 'none' : 'block';
  document.getElementById('main-app').style.display = logueado ? 'block' : 'none';
}

// Llamada inmediata justo después de declarar la función
actualizarVisibilidadApp();

document.getElementById('login-form').addEventListener('submit', async e => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) throw new Error('Credenciales inválidas');

    const data = await res.json();
    authToken = data.token;
    localStorage.setItem('jwt', authToken);
    document.getElementById('login-error').textContent = '';
    alert('¡Login correcto!');
    actualizarVisibilidadApp();
    fetchProducts(); // recarga productos con token
  } catch (err) {
    document.getElementById('login-error').textContent = err.message;
  }
});

async function fetchProducts() {
    try {
        const res = await fetch(API_URL,{
            headers: {'Authorization': `Bearer ${authToken || localStorage.getItem('jwt')}`,
            'Accept': 'application/json'
            }
    });
    const data = await res.json();

    const products = data; // ¡es un array directamente!

    const container = document.getElementById('product-list');
    container.innerHTML = '';

    products.forEach(p => {
      const div = document.createElement('div');
      div.classList.add('product-card');
      div.dataset.id = p.id;
      div.dataset.name = p.name;
      div.dataset.stock = p.stock;
      div.dataset.price = p.price;

      div.innerHTML = `
        <div>
          <strong>${p.name}</strong><br/>
          Stock: ${p.stock} uds - Precio: ${p.price} €
        </div>
        <div class="product-actions">
          <button data-id="${p.id}" class="edit-btn">Editar</button>
          <button data-id="${p.id}" class="delete-btn">Eliminar</button>
        </div>
      `;
      container.appendChild(div);

    });
  } catch (err) {
    console.error('Error al cargar productos:', err);
  }
}

fetchProducts();

document.getElementById('product-form').addEventListener('submit', async e => {
  e.preventDefault();

  const name = document.getElementById('product-name').value;
  const stock = parseInt(document.getElementById('product-stock').value);
  const price = parseFloat(document.getElementById('product-price').value);
  const token = localStorage.getItem('jwt');

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ name, stock, price })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al crear el producto');
    }

    document.getElementById('create-error').textContent = '';
    e.target.reset();
    fetchProducts(); // recarga la lista

  } catch (err) {
    document.getElementById('create-error').textContent = err.message;
  }
});

document.getElementById('product-list').addEventListener('click', async e => {
  if (e.target.classList.contains('delete-btn')) {
    const id = e.target.dataset.id;
    const token = localStorage.getItem('jwt');
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return;

    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Error al eliminar');
      fetchProducts(); // recarga
    } catch (err) {
      alert(err.message);
    }
  }
});

document.getElementById('product-list').addEventListener('click', e => {
  if (e.target.classList.contains('edit-btn')) {
    const id = e.target.dataset.id;
    const productDiv = e.target.closest('.product-card');

    // Evita duplicar formularios
    if (productDiv.querySelector('.edit-form')) return;

    // Extraer valores actuales
    const name = productDiv.dataset.name;
    const stock = parseInt(productDiv.dataset.stock);
    const price = parseFloat(productDiv.dataset.price);

    // Crear formulario de edición
    const form = document.createElement('form');
    form.classList.add('edit-form');
    form.innerHTML = `
      <input type="text" value="${name}" name="name" required />
      <input type="number" value="${stock}" name="stock" required />
      <input type="number" step="0.01" value="${price}" name="price" required />
      <button type="submit">Guardar</button>
      <button type="button" class="cancel-edit">Cancelar</button>
    `;
    const originalHTML = productDiv.innerHTML;
    productDiv.innerHTML = ''; // limpia el contenido visual
    productDiv.appendChild(form);


    // Cancelar edición
    form.querySelector('.cancel-edit').addEventListener('click', () => {
      productDiv.innerHTML = originalHTML;
    });


    // Guardar cambios
    form.addEventListener('submit', async ev => {
      ev.preventDefault();
      const token = localStorage.getItem('jwt');
      const updated = {
        name: form.name.value,
        stock: parseInt(form.stock.value),
        price: parseFloat(form.price.value)
      };

      try {
        const res = await fetch(`${API_URL}/${id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(updated)
        });

        if (!res.ok) throw new Error('Error al actualizar');
        fetchProducts(); // recarga la lista
      } catch (err) {
        alert(err.message);
      }
    });
  }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('jwt');
  actualizarVisibilidadApp();
  alert('Has cerrado sesión.');
  location.reload(); // refresca la app al estado inicial
});

