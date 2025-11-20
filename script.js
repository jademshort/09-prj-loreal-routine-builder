/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productSearch = document.getElementById("productSearch");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const toggleRTL = document.getElementById("toggleRTL");
const toggleText = document.getElementById("toggleText");

/* Array to store selected products */
let selectedProducts = [];

/* Array to store conversation history for context */
let conversationHistory = [];

/* Store all products and current view for search functionality */
let allProducts = [];
let currentViewProducts = [];

/* LocalStorage functions for persistent data */
function saveSelectedProductsToStorage() {
  try {
    localStorage.setItem('lorealSelectedProducts', JSON.stringify(selectedProducts));
  } catch (error) {
    console.error('Failed to save selected products to localStorage:', error);
  }
}

function loadSelectedProductsFromStorage() {
  try {
    const saved = localStorage.getItem('lorealSelectedProducts');
    if (saved) {
      selectedProducts = JSON.parse(saved);
      updateSelectedProductsDisplay();
    }
  } catch (error) {
    console.error('Failed to load selected products from localStorage:', error);
    selectedProducts = []; /* Reset to empty array on error */
  }
}

function clearAllSelectedProducts() {
  selectedProducts = [];
  saveSelectedProductsToStorage();
  updateSelectedProductsDisplay();
  updateProductCardVisuals();
}

/* Load saved products from localStorage on page load */
loadSelectedProductsFromStorage();

/* RTL Language Support Functions */
function toggleRTLMode() {
  const html = document.documentElement;
  const isRTL = html.getAttribute('dir') === 'rtl';
  
  if (isRTL) {
    /* Switch to LTR */
    html.setAttribute('dir', 'ltr');
    html.setAttribute('lang', 'en');
    toggleText.textContent = 'Text Direction';
    localStorage.setItem('lorealLanguageDir', 'ltr');
  } else {
    /* Switch to RTL */
    html.setAttribute('dir', 'rtl');
    html.setAttribute('lang', 'mul'); /* Multiple languages */
    toggleText.textContent = 'Text Direction';
    localStorage.setItem('lorealLanguageDir', 'rtl');
  }
}

function loadLanguagePreference() {
  try {
    const savedDir = localStorage.getItem('lorealLanguageDir');
    if (savedDir === 'rtl') {
      const html = document.documentElement;
      html.setAttribute('dir', 'rtl');
      html.setAttribute('lang', 'mul'); /* Multiple languages */
      toggleText.textContent = 'Text Direction';
    }
  } catch (error) {
    console.error('Failed to load language preference:', error);
  }
}

/* Initialize language preference on page load */
loadLanguagePreference();

/* Initialize search functionality on page load */
initializeSearch();

/* Show initial placeholder */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category or search all products to get started
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  /* Clear container */
  productsContainer.innerHTML = '';
  
  /* Create products grid with proper styling */
  const productsGrid = document.createElement('div');
  productsGrid.className = 'products-grid';
  productsGrid.innerHTML = products
    .map(
      (product) => {
        /* Check if product is already selected */
        const isSelected = selectedProducts.some(selected => selected.id === product.id);
        const selectedClass = isSelected ? ' selected' : '';
        
        return `
          <div class="product-card${selectedClass}" data-product-id="${product.id}">
            <img src="${product.image}" alt="${product.name}">
            <div class="product-info">
              <h3>${product.name}</h3>
              <p>${product.brand}</p>
            </div>
            <div class="selection-indicator">
              <i class="fa-solid ${isSelected ? 'fa-check-circle' : 'fa-circle'}"></i>
            </div>
            <div class="product-description-overlay">
              <h4>${product.name}</h4>
              <div class="brand-name">${product.brand}</div>
              <div class="description-text">${product.description}</div>
              <button class="mobile-add-btn ${isSelected ? 'selected' : ''}" data-product-id="${product.id}">
                ${isSelected ? '✓ Added' : '+ Add to Routine'}
              </button>
            </div>
          </div>
        `;
      }
    )
    .join("");
    
  /* Append grid to container */
  productsContainer.appendChild(productsGrid);
    
  /* Add click event listeners to product cards */
  addProductCardListeners(products);
}

/* Function to add click event listeners to product cards */
function addProductCardListeners(products) {
  const productCards = document.querySelectorAll('.product-card');
  
  productCards.forEach(card => {
    /* Handle click for selection - now works because overlay has pointer-events: none */
    card.addEventListener('click', (e) => {
      /* Check if clicking on mobile add button */
      if (e.target.classList.contains('mobile-add-btn')) {
        return; /* Let the button handler deal with this */
      }
      
      const productId = parseInt(card.dataset.productId);
      const product = products.find(p => p.id === productId);
      
      if (product) {
        toggleProductSelection(product);
      }
    });
    
    /* Handle mobile add button clicks */
    const mobileBtn = card.querySelector('.mobile-add-btn');
    if (mobileBtn) {
      mobileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const productId = parseInt(mobileBtn.dataset.productId);
        const product = products.find(p => p.id === productId);
        
        if (product) {
          toggleProductSelection(product);
        }
      });
    }
    
    /* Simplified mobile interaction - tap to show description */
    let isShowingDescription = false;
    
    /* For touch devices, use tap to toggle description */
    card.addEventListener('touchend', (e) => {
      /* If we're on a touch device (no hover capability) */
      if (window.matchMedia('(hover: none)').matches) {
        e.preventDefault();
        
        if (!isShowingDescription && !e.target.classList.contains('mobile-add-btn')) {
          card.classList.add('show-description');
          isShowingDescription = true;
        }
      }
    });
    
    /* Hide description when touching elsewhere on mobile */
    document.addEventListener('touchstart', (e) => {
      if (!e.target.closest('.product-card')) {
        card.classList.remove('show-description');
        isShowingDescription = false;
      }
    });
  });
}

/* Function to toggle product selection */
function toggleProductSelection(product) {
  const existingIndex = selectedProducts.findIndex(selected => selected.id === product.id);
  
  if (existingIndex > -1) {
    /* Product is already selected, remove it */
    selectedProducts.splice(existingIndex, 1);
  } else {
    /* Product is not selected, add it */
    selectedProducts.push(product);
  }
  
  /* Save to localStorage */
  saveSelectedProductsToStorage();
  
  /* Update the selected products display */
  updateSelectedProductsDisplay();
  
  /* Update the visual state of product cards */
  updateProductCardVisuals();
}

/* Function to update the selected products list display */
function updateSelectedProductsDisplay() {
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = '<p class="no-products">No products selected yet. Click on product cards to add them!</p>';
    return;
  }
  
  selectedProductsList.innerHTML = `
    <div class="selected-products-header">
      <span class="selected-count">${selectedProducts.length} product${selectedProducts.length !== 1 ? 's' : ''} selected</span>
      <button class="clear-all-btn" title="Clear all selected products">
        <i class="fa-solid fa-trash"></i> Clear All
      </button>
    </div>
    <div class="selected-products-grid">
      ${selectedProducts
        .map(product => `
          <div class="selected-product-item" data-product-id="${product.id}">
            <img src="${product.image}" alt="${product.name}">
            <div class="selected-product-info">
              <h4>${product.name}</h4>
              <p>${product.brand}</p>
            </div>
            <button class="remove-product-btn" data-product-id="${product.id}" title="Remove this product">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>
        `)
        .join('')}
    </div>
  `;
    
  /* Add click listeners to remove buttons */
  addRemoveButtonListeners();
  
  /* Add click listener to clear all button */
  addClearAllButtonListener();
}

/* Function to add click listeners to remove buttons */
function addRemoveButtonListeners() {
  const removeButtons = document.querySelectorAll('.remove-product-btn');
  
  removeButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation(); /* Prevent event bubbling */
      const productId = parseInt(button.dataset.productId);
      const product = selectedProducts.find(p => p.id === productId);
      
      if (product) {
        toggleProductSelection(product);
      }
    });
  });
}

/* Function to add click listener to clear all button */
function addClearAllButtonListener() {
  const clearAllBtn = document.querySelector('.clear-all-btn');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      
      /* Show confirmation for better UX */
      if (confirm(`Are you sure you want to remove all ${selectedProducts.length} selected products?`)) {
        clearAllSelectedProducts();
        
        /* Add feedback message to chat */
        addMessageToChat('All selected products have been cleared.', false);
      }
    });
  }
}

/* Function to update visual state of product cards */
function updateProductCardVisuals() {
  const productCards = document.querySelectorAll('.product-card');
  
  productCards.forEach(card => {
    const productId = parseInt(card.dataset.productId);
    const isSelected = selectedProducts.some(selected => selected.id === productId);
    const icon = card.querySelector('.selection-indicator i');
    const mobileBtn = card.querySelector('.mobile-add-btn');
    
    if (isSelected) {
      card.classList.add('selected');
      icon.className = 'fa-solid fa-check-circle';
      if (mobileBtn) {
        mobileBtn.classList.add('selected');
        mobileBtn.textContent = '✓ Added';
      }
    } else {
      card.classList.remove('selected');
      icon.className = 'fa-solid fa-circle';
      if (mobileBtn) {
        mobileBtn.classList.remove('selected');
        mobileBtn.textContent = '+ Add to Routine';
      }
    }
  });
}

/* Enhanced product card listeners for cross-category support */
function addProductCardListeners(products) {
  const productCards = document.querySelectorAll('.product-card');
  
  productCards.forEach(card => {
    /* Handle click for selection */
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('mobile-add-btn')) {
        return;
      }
      
      const productId = parseInt(card.dataset.productId);
      /* Find product in all products array since we might be viewing cross-category results */
      const product = allProducts.find(p => p.id === productId);
      
      if (product) {
        toggleProductSelection(product);
      }
    });
    
    /* Handle mobile add button clicks */
    const mobileBtn = card.querySelector('.mobile-add-btn');
    if (mobileBtn) {
      mobileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const productId = parseInt(mobileBtn.dataset.productId);
        const product = allProducts.find(p => p.id === productId);
        
        if (product) {
          toggleProductSelection(product);
        }
      });
    }
    
    /* Mobile touch interactions remain the same */
    let isShowingDescription = false;
    
    card.addEventListener('touchend', (e) => {
      if (window.matchMedia('(hover: none)').matches) {
        e.preventDefault();
        
        if (!isShowingDescription && !e.target.classList.contains('mobile-add-btn')) {
          card.classList.add('show-description');
          isShowingDescription = true;
        }
      }
    });
    
    document.addEventListener('touchstart', (e) => {
      if (!e.target.closest('.product-card')) {
        card.classList.remove('show-description');
        isShowingDescription = false;
      }
    });
  });
}

/* Function to filter products by search term */
function filterProductsBySearch(products, searchTerm) {
  if (!searchTerm.trim()) {
    return products;
  }
  
  const term = searchTerm.toLowerCase();
  return products.filter(product => 
    product.name.toLowerCase().includes(term) ||
    product.brand.toLowerCase().includes(term) ||
    product.description.toLowerCase().includes(term) ||
    product.category.toLowerCase().includes(term)
  );
}

/* Function to initialize search functionality */
async function initializeSearch() {
  allProducts = await loadProducts();
  currentViewProducts = []; /* Start with empty view */
}

/* Function to apply all filters and display products */
function applyFiltersAndDisplay() {
  const searchTerm = productSearch.value.trim();
  const selectedCategory = categoryFilter.value;
  
  let filteredProducts = [];
  
  /* If there's a search term, search all products or within category */
  if (searchTerm) {
    const productsToSearch = selectedCategory ? 
      allProducts.filter(p => p.category === selectedCategory) : 
      allProducts;
    filteredProducts = filterProductsBySearch(productsToSearch, searchTerm);
  } else if (selectedCategory) {
    /* If category selected but no search, show category products */
    filteredProducts = allProducts.filter(p => p.category === selectedCategory);
  } else {
    /* No search and no category - show placeholder */
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        Select a category or search all products to get started
      </div>
    `;
    return;
  }
  
  currentViewProducts = filteredProducts;
  
  /* Display results or no results message */
  if (filteredProducts.length === 0) {
    let searchMessage;
    if (searchTerm && selectedCategory) {
      searchMessage = `No ${selectedCategory} products found matching "${searchTerm}"`;
    } else if (searchTerm) {
      searchMessage = `No products found matching "${searchTerm}"`;
    } else {
      searchMessage = `No products found in ${selectedCategory}`;
    }
    
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        ${searchMessage}
        ${searchTerm ? '<br><small>Try different keywords or check spelling</small>' : ''}
      </div>
    `;
  } else {
    /* Clear container and add results info above the grid */
    productsContainer.innerHTML = '';
    
    /* Add search results info */
    if (searchTerm) {
      const categoryText = selectedCategory ? ` in ${selectedCategory}` : '';
      const resultsInfo = document.createElement('div');
      resultsInfo.className = 'search-results-info';
      resultsInfo.innerHTML = `Found ${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''}${categoryText} matching "${searchTerm}"`;
      productsContainer.appendChild(resultsInfo);
    }
    
    /* Create products grid with proper styling */
    const productsGrid = document.createElement('div');
    productsGrid.className = 'products-grid';
    productsGrid.innerHTML = currentViewProducts
      .map(
        (product) => {
          /* Check if product is already selected */
          const isSelected = selectedProducts.some(selected => selected.id === product.id);
          const selectedClass = isSelected ? ' selected' : '';
          
          return `
            <div class="product-card${selectedClass}" data-product-id="${product.id}">
              <img src="${product.image}" alt="${product.name}">
              <div class="product-info">
                <h3>${product.name}</h3>
                <p>${product.brand}</p>
              </div>
              <div class="selection-indicator">
                <i class="fa-solid ${isSelected ? 'fa-check-circle' : 'fa-circle'}"></i>
              </div>
              <div class="product-description-overlay">
                <h4>${product.name}</h4>
                <div class="brand-name">${product.brand}</div>
                <div class="description-text">${product.description}</div>
                <button class="mobile-add-btn ${isSelected ? 'selected' : ''}" data-product-id="${product.id}">
                  ${isSelected ? '✓ Added' : '+ Add to Routine'}
                </button>
              </div>
            </div>
          `;
        }
      )
      .join("");
      
    productsContainer.appendChild(productsGrid);
    
    /* Add click event listeners to product cards */
    addProductCardListeners(currentViewProducts);
  }
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", (e) => {
  const selectedCategory = e.target.value;
  
  /* Update search placeholder to reflect current context */
  if (selectedCategory) {
    const categoryProducts = allProducts.filter(p => p.category === selectedCategory);
    productSearch.placeholder = `Search ${categoryProducts.length} ${selectedCategory} products or all products...`;
  } else {
    productSearch.placeholder = "Search all products by name or keyword...";
  }

  /* Apply filters and display */
  applyFiltersAndDisplay();
});

/* Real-time search as user types with debouncing for performance */
let searchTimeout;
productSearch.addEventListener("input", () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    applyFiltersAndDisplay();
    
    /* Update search icon to show activity */
    const searchIcon = document.querySelector('.search-icon');
    if (productSearch.value.trim()) {
      searchIcon.className = 'fa-solid fa-times search-icon search-active';
      searchIcon.style.cursor = 'pointer';
      searchIcon.onclick = clearSearch;
    } else {
      searchIcon.className = 'fa-solid fa-search search-icon';
      searchIcon.style.cursor = 'default';
      searchIcon.onclick = null;
    }
  }, 300); /* 300ms delay for better performance */
});

/* Function to clear search */
function clearSearch() {
  productSearch.value = "";
  applyFiltersAndDisplay();
  const searchIcon = document.querySelector('.search-icon');
  searchIcon.className = 'fa-solid fa-search search-icon';
  searchIcon.style.cursor = 'default';
  searchIcon.onclick = null;
  productSearch.focus();
}

/* Add keyboard shortcuts for better UX */
productSearch.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    clearSearch();
  }
});

/* Function to send messages to OpenAI via Cloudflare Worker */
async function sendMessageToAI(userMessage, isRoutineGeneration = false) {
  try {
    /* Create context about selected products for AI awareness */
    let selectedProductsContext = "";
    if (selectedProducts.length > 0) {
      selectedProductsContext = `\n\nCurrent selected products: ${selectedProducts.map(p => `${p.name} by ${p.brand} (${p.category})`).join(", ")}`;
    }
    
    /* Build messages array starting with system prompt */
    const messages = [
      {
        role: "system",
        content: `You are a L'Oréal beauty advisor helping customers build personalized skincare and beauty routines. You specialize in products from L'Oréal brands including CeraVe, La Roche-Posay, Vichy, L'Oréal Paris, Maybelline, Lancôme, Garnier, Kiehl's, Kérastase, SkinCeuticals, Urban Decay, Yves Saint Laurent, and Redken. 

You should only discuss topics related to:
- Skincare routines and products
- Haircare and styling
- Makeup application and techniques  
- Fragrance recommendations
- Beauty tips and advice
- Product ingredients and benefits
- Routine modifications and improvements

If asked about unrelated topics, politely redirect the conversation back to beauty and skincare.

Provide helpful, friendly advice. Keep responses concise but informative.${selectedProductsContext}`
      }
    ];
    
    /* Add conversation history for context (limit to last 10 exchanges to avoid token limits) */
    const recentHistory = conversationHistory.slice(-20); /* Last 10 user-AI exchanges */
    messages.push(...recentHistory);
    
    /* Add current user message */
    messages.push({
      role: "user", 
      content: userMessage
    });

    /* Send request to Cloudflare Worker with extended parameters */
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        messages,
        max_tokens: 1500, /* Increase token limit for longer responses */
        temperature: 0.7 /* Consistent, helpful responses */
      })
    });

    /* Check if the response is successful */
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    /* Get the response data */
    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    /* Store this exchange in conversation history */
    conversationHistory.push(
      { role: "user", content: userMessage },
      { role: "assistant", content: aiResponse }
    );
    
    /* Extract the AI message from the response */
    return aiResponse;
    
  } catch (error) {
    console.error("Error sending message to AI:", error);
    return "Sorry, I'm having trouble connecting right now. Please try again in a moment.";
  }
}

/* Function to add messages to chat window */
function addMessageToChat(message, isUser = false) {
  const messageDiv = document.createElement("div");
  messageDiv.className = isUser ? "chat-message user-message" : "chat-message ai-message";
  
  /* Check if message appears to be cut off and add indicator */
  const isTruncated = !isUser && (
    message.endsWith('...') || 
    !message.match(/[.!?]$/) || 
    message.length > 800 /* Likely truncated if very long without proper ending */
  );
  
  if (isTruncated) {
    messageDiv.innerHTML = `
      <div class="message-content">${message.replace(/\n/g, '<br>')}</div>
      <div class="truncation-notice">
        <i class="fa-solid fa-exclamation-triangle"></i>
        Response may have been cut off. Try asking "Can you continue?" or be more specific.
      </div>
    `;
  } else {
    /* Convert line breaks to HTML for better formatting */
    messageDiv.innerHTML = message.replace(/\n/g, '<br>');
  }
  
  chatWindow.appendChild(messageDiv);
  
  /* Scroll to bottom of chat */
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Function to show loading indicator */
function showLoadingMessage() {
  const loadingDiv = document.createElement("div");
  loadingDiv.className = "chat-message ai-message loading";
  loadingDiv.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Thinking...';
  loadingDiv.id = "loading-message";
  chatWindow.appendChild(loadingDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return loadingDiv;
}

/* Generate Routine button handler */
document.getElementById("generateRoutine").addEventListener("click", async () => {
  /* Check if user has selected any products */
  if (selectedProducts.length === 0) {
    addMessageToChat("Please select some products first before generating a routine!", false);
    return;
  }
  
  /* Add user action message to chat */
  addMessageToChat(`Generate a routine using my ${selectedProducts.length} selected products`, true);
  
  /* Show loading indicator */
  const loadingElement = showLoadingMessage();
  
  /* Create detailed product information for AI */
  const productDetails = selectedProducts.map(product => ({
    name: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description
  }));
  
  /* Create specialized prompt for routine generation - optimized to avoid truncation */
  const routinePrompt = `Create a concise but complete beauty routine using these products:

${productDetails.map(product => 
  `• ${product.name} by ${product.brand} (${product.category})`
).join('\n')}

Provide a structured routine with:
1. Morning steps (if applicable)
2. Evening steps (if applicable) 
3. Application order and basic usage tips
4. Frequency (daily/weekly)

Keep it detailed but concise. End with "Routine complete!" so I know it's finished.`;

  /* Send routine generation request to AI */
  const aiResponse = await sendMessageToAI(routinePrompt, true);
  
  /* Remove loading indicator */
  loadingElement.remove();
  
  /* Add AI routine to chat */
  addMessageToChat(aiResponse);
});

/* Chat form submission handler with OpenAI integration */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  /* Get user input and clear the form */
  const userInput = document.getElementById("userInput");
  const userMessage = userInput.value.trim();
  
  if (!userMessage) return;
  
  /* Add user message to chat */
  addMessageToChat(userMessage, true);
  
  /* Clear input field */
  userInput.value = "";
  
  /* Show loading indicator */
  const loadingElement = showLoadingMessage();
  
  /* Send message to AI and get response */
  const aiResponse = await sendMessageToAI(userMessage);
  
  /* Remove loading indicator */
  loadingElement.remove();
  
  /* Add AI response to chat */
  addMessageToChat(aiResponse);
});

/* RTL toggle event listener */
if (toggleRTL) {
  toggleRTL.addEventListener('click', toggleRTLMode);
}

/* Scroll Effects for Header */
function initScrollEffects() {
  const header = document.querySelector('.site-header');
  const headerContent = document.querySelector('.header-content');
  const logo = document.querySelector('.logo');
  
  if (!header || !headerContent) return;
  
  let ticking = false;
  
  function updateScrollEffect() {
    const scrolled = window.pageYOffset;
    const headerHeight = header.offsetHeight;
    const scrollProgress = Math.min(scrolled / (headerHeight * 0.8), 1);
    
    /* Background zoom effect (100% to 120%) */
    const zoomScale = 100 + (scrollProgress * 20);
    header.style.backgroundSize = `${zoomScale}%`;
    
    /* Text fade out effect */
    const opacity = Math.max(1 - (scrollProgress * 1.5), 0);
    const translateY = scrollProgress * 30;
    
    if (headerContent) {
      headerContent.style.opacity = opacity;
      headerContent.style.transform = `translateY(${translateY}px)`;
    }
    
    /* Logo stays visible longer */
    if (logo) {
      const logoOpacity = Math.max(1 - (scrollProgress * 0.8), 0);
      logo.style.opacity = logoOpacity;
    }
    
    ticking = false;
  }
  
  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateScrollEffect);
      ticking = true;
    }
  }
  
  /* Listen for scroll events */
  window.addEventListener('scroll', requestTick, { passive: true });
  
  /* Initial call */
  updateScrollEffect();
}

/* Initialize scroll effects when DOM is loaded */
document.addEventListener('DOMContentLoaded', initScrollEffects);
