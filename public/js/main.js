// Main JavaScript file for Admin Dashboard

// Sidebar toggle functionality
function toggleSidebar() {
    const sidebar = document.getElementById('sidebarMenu');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar && overlay) {
        sidebar.classList.toggle('show');
        overlay.classList.toggle('show');
    }
}

// Admin Dashboard JavaScript

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    
    // Initialize sidebar functionality
    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) {
        overlay.addEventListener('click', function() {
            toggleSidebar();
        });
    }
    
    // Close sidebar on window resize if mobile
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 768) {
            const sidebar = document.getElementById('sidebarMenu');
            const overlay = document.getElementById('sidebarOverlay');
            if (sidebar && overlay) {
                sidebar.classList.remove('show');
                overlay.classList.remove('show');
            }
        }
    });
});

function initializeApp() {
    // Add fade-in animation to cards
    animateCards();
    
    // Initialize tooltips
    initializeTooltips();
    
    // Initialize form validation
    initializeFormValidation();
    
    // Initialize delete confirmations
    initializeDeleteConfirmations();
    
    // Initialize search functionality
    initializeSearch();
    
    // Initialize responsive tables
    initializeResponsiveTables();
    
    // Initialize dashboard counters
    initializeDashboardCounters();
}

// Animate cards on page load
function animateCards() {
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('fade-in');
        }, index * 100);
    });
}

// Initialize Bootstrap tooltips
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Form validation
function initializeFormValidation() {
    const forms = document.querySelectorAll('.needs-validation');
    
    Array.prototype.slice.call(forms).forEach(function(form) {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });
    
    // Real-time validation feedback
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            if (this.classList.contains('is-invalid')) {
                validateField(this);
            }
        });
    });
}

// Validate individual field
function validateField(field) {
    const value = field.value.trim();
    const type = field.type;
    const required = field.hasAttribute('required');
    
    // Remove existing validation classes
    field.classList.remove('is-valid', 'is-invalid');
    
    // Check if required field is empty
    if (required && !value) {
        field.classList.add('is-invalid');
        return false;
    }
    
    // Email validation
    if (type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            field.classList.add('is-invalid');
            return false;
        }
    }
    
    // Phone validation (Dutch format)
    if (field.name === 'telefoon' && value) {
        const phoneRegex = /^(\+31|0)[1-9][0-9]{8}$/;
        if (!phoneRegex.test(value.replace(/\s/g, ''))) {
            field.classList.add('is-invalid');
            return false;
        }
    }
    
    // Salary validation
    if (field.name === 'salaris' && value) {
        const salary = parseFloat(value);
        if (isNaN(salary) || salary < 0) {
            field.classList.add('is-invalid');
            return false;
        }
    }
    
    // If we get here, field is valid
    if (value) {
        field.classList.add('is-valid');
    }
    return true;
}

// Delete confirmations
function initializeDeleteConfirmations() {
    const deleteButtons = document.querySelectorAll('[data-action="delete"]');
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const itemType = this.dataset.type || 'item';
            const itemName = this.dataset.name || 'dit item';
            const deleteUrl = this.dataset.url;
            
            if (deleteUrl) {
                showDeleteConfirmation(itemType, itemName, deleteUrl);
            }
        });
    });
}

// Show delete confirmation modal
function showDeleteConfirmation(type, name, url) {
    let modal = document.getElementById('deleteConfirmationModal');
    if (!modal) {
        modal = createDeleteModal();
    }
    
    const modalTitle = modal.querySelector('.modal-title');
    const modalBody = modal.querySelector('.modal-body');
    const confirmButton = modal.querySelector('#confirmDeleteBtn');
    
    modalTitle.textContent = `${type} Verwijderen`;
    modalBody.innerHTML = `
        <p>Weet je zeker dat je <strong>${name}</strong> wilt verwijderen?</p>
        <p class="text-muted mb-0">Deze actie kan niet ongedaan worden gemaakt.</p>
    `;
    
    const form = modal.querySelector('#deleteForm');
    form.action = url.split('?')[0];

    // Clear previous onclick event to avoid multiple submissions
    const newConfirmButton = confirmButton.cloneNode(true);
    confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);

    newConfirmButton.addEventListener('click', () => {
        form.submit();
    });

    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

function createDeleteModal() {
    const modalHtml = `
    <div class="modal fade" id="deleteConfirmationModal" tabindex="-1" aria-labelledby="deleteModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="deleteModalLabel">Item Verwijderen</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p>Weet je zeker dat je dit item wilt verwijderen?</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuleren</button>
            <form id="deleteForm" method="POST" style="display: inline;">
              <input type="hidden" name="_method" value="DELETE">
              <button type="submit" id="confirmDeleteBtn" class="btn btn-danger">Verwijderen</button>
            </form>
          </div>
        </div>
      </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    return document.getElementById('deleteConfirmationModal');
}

// Search functionality
function initializeSearch() {
    const searchInputs = document.querySelectorAll('[data-search]');
    
    searchInputs.forEach(input => {
        input.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const targetSelector = this.dataset.search;
            const targets = document.querySelectorAll(targetSelector);
            
            targets.forEach(target => {
                const text = target.textContent.toLowerCase();
                const shouldShow = text.includes(searchTerm);
                
                target.style.display = shouldShow ? '' : 'none';
                
                // Add highlight effect
                if (shouldShow && searchTerm) {
                    target.classList.add('search-highlight');
                } else {
                    target.classList.remove('search-highlight');
                }
            });
        });
    });
}

// Responsive tables
function initializeResponsiveTables() {
    const tables = document.querySelectorAll('.table-responsive table');
    
    tables.forEach(table => {
        // Add mobile-friendly classes
        table.classList.add('table-sm');
        
        // Handle table overflow on mobile
        if (window.innerWidth < 768) {
            const headers = table.querySelectorAll('thead th');
            const rows = table.querySelectorAll('tbody tr');
            
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                cells.forEach((cell, index) => {
                    if (headers[index]) {
                        cell.setAttribute('data-label', headers[index].textContent);
                    }
                });
            });
        }
    });
}

// Dashboard counters animation
function initializeDashboardCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    counters.forEach(counter => {
        observer.observe(counter);
    });
}

// Animate counter numbers
function animateCounter(element) {
    const target = parseInt(element.dataset.counter);
    const duration = 2000; // 2 seconds
    const step = target / (duration / 16); // 60fps
    let current = 0;
    
    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current).toLocaleString('nl-NL');
    }, 16);
}

// Utility functions
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
}

function formatDate(dateString) {
    return new Intl.DateTimeFormat('nl-NL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(new Date(dateString));
}

function formatPhone(phone) {
    // Format Dutch phone numbers
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('31')) {
        return `+31 ${cleaned.slice(2, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
    } else if (cleaned.startsWith('0')) {
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    return phone;
}

// Export functions for global use
window.AdminDashboard = {
    showNotification,
    formatCurrency,
    formatDate,
    formatPhone,
    showDeleteConfirmation
};

// Export additional functions for global use
window.toggleSidebar = toggleSidebar;

// Handle responsive navigation
window.addEventListener('resize', function() {
    if (window.innerWidth < 768) {
        document.body.classList.add('mobile-view');
    } else {
        document.body.classList.remove('mobile-view');
    }
});

// Trigger resize event on load
window.dispatchEvent(new Event('resize'));

// Add loading states to forms
document.addEventListener('submit', function(e) {
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    
    if (submitButton) {
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Bezig...';
        submitButton.disabled = true;
        
        // Re-enable after 3 seconds (fallback)
        setTimeout(() => {
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }, 3000);
    }
});

// Add CSS for search highlighting
const style = document.createElement('style');
style.textContent = `
    .search-highlight {
        background-color: rgba(255, 255, 0, 0.3);
        transition: background-color 0.3s ease;
    }
    
    @media (max-width: 767px) {
        .mobile-view .table-responsive table,
        .mobile-view .table-responsive thead,
        .mobile-view .table-responsive tbody,
        .mobile-view .table-responsive th,
        .mobile-view .table-responsive td,
        .mobile-view .table-responsive tr {
            display: block;
        }
        
        .mobile-view .table-responsive thead tr {
            position: absolute;
            top: -9999px;
            left: -9999px;
        }
        
        .mobile-view .table-responsive tr {
            border: 1px solid #ccc;
            margin-bottom: 10px;
            padding: 10px;
            border-radius: 8px;
        }
        
        .mobile-view .table-responsive td {
            border: none;
            position: relative;
            padding-left: 50% !important;
            text-align: left;
        }
        
        .mobile-view .table-responsive td:before {
            content: attr(data-label) ":";
            position: absolute;
            left: 6px;
            width: 45%;
            padding-right: 10px;
            white-space: nowrap;
            font-weight: bold;
            color: #333;
        }
    }
`;
document.head.appendChild(style);