const BASE_API = window.BASE_API_URL || 'http://localhost:3000'

let currentPage = 1 
const recipesPerPage = 12 
let currentQuery = '' 
let totalResults = 0 
const spoonacularContainer = document.querySelector('.recipe-cards-section')
//Function is fetching the complex search from spoonacular
async function fetchRecipes(query, page = 1, isRandom = false){
    const number = recipesPerPage
    let API_URL = `${BASE_API}/api/recipes?query=${query}&number=${recipesPerPage}`

    if(isRandom){
        API_URL += `&random=true`
    } else {
        const offset = (page - 1) * recipesPerPage
        API_URL += `&offset=${offset}`
    }
    if(!query)return
    try{
        const apiResponse = await fetch(API_URL)
        const data = await apiResponse.json()
        return {
            recipes: data.results,
            totalResults: data.totalResults
        }
    } catch (error){
        console.error('error fetching recipes', error)
    }
}

function displayRecipes(recipes){
    spoonacularContainer.innerHTML = ''
    if(!recipes || recipes.length === 0){
        spoonacularContainer.innerHTML = '<p>No recipes found </p>'
        return
    }
    recipes.forEach(recipe => {
        const recipeCard = document.createElement('div')
        recipeCard.classList.add('recipe-card')
        recipeCard.innerHTML = `
            <div class="recipe-image-container">
                <img src="${recipe.image}" alt="${recipe.title}" class="recipe-image" />
            </div>
            <h3>${recipe.title}</h3>
        `
        const newRecipeCard = recipeCard.setAttribute('data-recipe', recipe.id)
        spoonacularContainer.appendChild(recipeCard)
    })
    attachEventListeners()
}

function attachEventListeners(){
    const recipeCardsContainer = spoonacularContainer.querySelectorAll('[data-recipe]')
    recipeCardsContainer.forEach(recipe => {
        recipe.addEventListener('click', async (event) => {
            const recipeId = event.currentTarget.getAttribute('data-recipe')
            const title = event.currentTarget.querySelector('h3').textContent
            const image = event.currentTarget.querySelector('img.recipe-image').src
            const recipeInstructions = await displayRecipeData(recipeId)
            console.log('Step 2 - recipeInstructions:', recipeInstructions)
            const modal = displayModal({
                title,
                image,
                instructions: recipeInstructions.instructions,
                ingredients: recipeInstructions.ingredients,
                servings: recipeInstructions.servings
            })
        })
    })
}
//Have a modal with all the data of recipe instructions and ingredients
function displayModal(recipe){
    console.log(' Step 3 - recipe received in modal:', recipe)
    const modalOverlay = document.createElement('div')
    modalOverlay.classList.add('modal-overlay')
    const modal = document.createElement('div')
    modal.classList.add('modal')
     
    modal.innerHTML = `
        <div class="modal-header">
            <div class="title">${recipe.title}</div>
            <button class="close-modal">X</button>
        </div>
        <img src="${recipe.image}" alt="${recipe.title}" class="modal-image" />
        <div class="modal-body">
            <label class="switch">
                <input type="checkbox" id="unit-toggle">
                <span class="slider"></span>
            </label>
            <span id="unit-status">US units </span>

            <div class="servings-control">
                <button id="increment-servings">+</button>
                <button id="decrement-servings">-</button>
                <button id="reset-servings">reset</button>
                <span id="servings-count">${recipe.servings || 1}</span>
            </div>
            <h2>Instructions</h2>
            ${recipe.instructions.map(instruction => `<p><strong>Step ${instruction.number}:</strong> ${instruction.step}</p>`).join('')}
            <h2>Ingredients</h2>
            <ul id="ingredients-list">
                ${recipe.ingredients.map(ingredient =>`
                <li data-us="${ingredient.name}: ${ingredient.measures.us}"
                data-metric="${ingredient.name}: ${ingredient.measures.metric}">
                ${ingredient.name}: ${ingredient.measures.us}</li>`).join('')}
            </ul>
        </div>`
    
    modalOverlay.appendChild(modal)
    document.body.appendChild(modalOverlay)
    document.body.style.overflow = 'hidden'

    modalOverlay.querySelector('.close-modal').addEventListener('click', () => {
    modalOverlay.remove()
    document.body.style.overflow = ''
    })
    const originalServingsSize = recipe.servings || 1
    console.log('Step 4 - originalServingsSize:', originalServingsSize)

    const addServingsButton = document.querySelector('#increment-servings')
    const decrementServingsButton = document.querySelector('#decrement-servings')
    const resetServingsButton = document.querySelector('#reset-servings')
    const servingsCount = document.querySelector('#servings-count')
    updateUnitToggle(recipe, originalServingsSize)

    addServingsButton.addEventListener('click', () => scaleServings(recipe, 'increment', servingsCount, originalServingsSize));
    decrementServingsButton.addEventListener('click', () => scaleServings(recipe, 'decrement', servingsCount, originalServingsSize))
    resetServingsButton.addEventListener('click', () => scaleServings(recipe, 'reset', servingsCount, originalServingsSize))
    return modal
}

function updateUnitToggle(recipe, originalServingsSize){
    const unitToggle = document.querySelector('#unit-toggle')
    const unitStatus = document.querySelector('#unit-status')
    unitToggle.addEventListener('change', () => {
        let system
        if(unitToggle.checked){
            unitStatus.textContent = 'metric system'
            system = 'metric'
        } else {
            unitStatus.textContent = 'us system'
            system = 'us'
        }
        updateIngredientsUnit(system)
        scaleIngredients(recipe, originalServingsSize)
    })
    scaleIngredients(recipe, originalServingsSize)
}

function updateIngredientsUnit(system){
    const listOfIngredients = document.querySelectorAll('#ingredients-list li')
    listOfIngredients.forEach(li => {
        if(system === 'metric'){
            li.textContent = li.dataset.metric
        } else {
            li.textContent = li.dataset.us
        }
    })
}

function scaleServings(recipe, operation, servingsCount, originalServingsSize){
    switch(operation){
        case 'increment':
            recipe.servings++
            break
        case 'decrement':
            if(recipe.servings > 1) recipe.servings--
            break
        case 'reset': 
            recipe.servings = originalServingsSize
            break
    }
    servingsCount.textContent =  recipe.servings
    scaleIngredients(recipe, originalServingsSize)
}
// Function will scale ingredients allowing users to add more servings decrement servings
function scaleIngredients(recipe, originalServingsSize){
    const listOfIngredients = document.querySelectorAll('#ingredients-list li')
    const unitToggle = document.querySelector('#unit-toggle')
    const isMetricChecked = unitToggle.checked
    recipe.ingredients.forEach((ingredient, index) => {
        const li = listOfIngredients[index]
        const dataUs = li.dataset.us
        const dataMetric = li.dataset.metric

        const currentDataString = isMetricChecked ? dataMetric : dataUs
        const parts = currentDataString.split(':')[1].trim().split(' ')

        const originalAmount = parseFloat(parts[0])

        console.log(`Scaling ingredient: ${ingredient.name}`, { currentDataString, parts, originalAmount, recipeServings: recipe.servings, originalServingsSize })


        if(isNaN(originalAmount)){
            li.textContent = currentDataString
            return
        }

        const unit = parts.slice(1).join(' ')

        const calculateServings = (originalAmount / originalServingsSize) * recipe.servings

        const formatted = Number.isInteger(calculateServings) ? calculateServings : +calculateServings.toFixed(2)
        li.textContent = `${ingredient.name}: ${formatted} ${unit}`
    })
}
//This function is going to display the recipe data from instructions url and ingredients
async function displayRecipeData(recipeId){
    if(!recipeId){
        console.error('Missing recipe Id')
        return
    }
    const endPoint =  `${BASE_API}/api/recipes/${recipeId}/instructions`
    const response = await fetch(endPoint)
    if(!response.ok){
        console.error('error fetching recipe data')
        const errorData = await response.json()
        console.error('server error', errorData)
        return
    }
    const recipeData = await response.json()
     console.log(' Step 1 - recipeData from backend:', recipeData)

    return {
      instructions: recipeData.instructions,
      ingredients: recipeData.ingredients,
      servings: recipeData.servings,
      readyInMinutes: recipeData.readyInMinutes,
      recipeId: recipeData.id
    }
}
// These are recipe categories i created to give users an idea if they dont know
function displayCategories(){
    const categories = document.querySelectorAll('[data-category]')
    categories.forEach(category => {
        category.addEventListener('click', async () => {
            const categoryName = category.dataset.category
            currentQuery = categoryName
            currentPage = 1
            const {recipes, totalResults} = await fetchRecipes(categoryName, 1, true)
            displayRecipes(recipes)
            displayLoaderButton(recipes, totalResults, true)
        })
    })
}

displayCategories()
// Lets user search mannualy for specific recipes
function searchRecipes(){
    const searchBar = document.querySelector('#search-food')
    const searchButton = document.querySelector('#search')
    searchButton.addEventListener('click', async () => {
        const userInput = searchBar.value.toLowerCase()
        if(userInput === currentQuery){
            return
        }
        searchButton.disabled = true
        if(userInput && userInput.length > 3){
            const result = await fetchRecipes(userInput, 1, false)
            if(result && result.recipes){
                currentPage = 1
                displayRecipes(result.recipes)
                displayLoaderButton(result.recipes, result.totalResults)
                currentQuery = userInput
            } else {
                alert('failed to get your recipe')
            }
            searchButton.disabled = false
        } else {
            alert('add a valid recipe')
            searchButton.disabled = false
        }
    })
}
searchRecipes()

const loadMoreButton = document.querySelector('.loader')
const newRecipesButton = document.querySelector('.new-recipes')
//console.log(newRecipesButton)

function displayLoaderButton(recipes, totalResults, isRandom = false){
    if(!recipes || !Array.isArray(recipes)){
        loadMoreButton.style.display = 'none'
        newRecipesButton.style.display = 'none'
        return
    }
    if(isRandom){
        loadMoreButton.style.display = 'none'
        newRecipesButton.style.display = 'block'
    } else {
        newRecipesButton.style.display = 'none'
        if(totalResults > recipes.length){
            loadMoreButton.style.display = 'block'
        } else {
            loadMoreButton.style.display = 'none'
        }
    }
}


loadMoreButton.addEventListener('click', loadMoreRecipes)
newRecipesButton.addEventListener('click', generateNewRecipes)


async function loadMoreRecipes(){
    if(!currentQuery) return
   const maxLoadableRecipes = 60
   const newRecipesPage = currentPage + 1
   currentPage = newRecipesPage 
   loadMoreButton.disabled = true
   const fetchedNewRecipes = await fetchRecipes(currentQuery, currentPage)
   if(!fetchedNewRecipes || !fetchedNewRecipes.recipes){
    loadMoreButton.disabled = false
    return
   }
   appendRecipes(fetchedNewRecipes.recipes)
   totalResults = fetchedNewRecipes.totalResults
   const loadedRecipes = currentPage * recipesPerPage

    if(loadedRecipes < totalResults && loadedRecipes < maxLoadableRecipes){
       loadMoreButton.disabled = false
   } else {
       loadMoreButton.style.display = 'none'
   }    
}

async function generateNewRecipes(){
    if(!currentQuery) return
    currentPage = 1
    const {recipes, totalResults} = await fetchRecipes(currentQuery, 1, true)
    displayRecipes(recipes)
    displayLoaderButton(recipes, totalResults, true)
}

function appendRecipes(recipes){
  recipes.forEach(recipe => {
    const recipeCard = document.createElement('div')
    recipeCard.classList.add('recipe-card')
    recipeCard.innerHTML = `
      <div class="recipe-image-container">
        <img src="${recipe.image}" alt="${recipe.title}" class="recipe-image" />
        <img src="assets/favorite.png" alt="Save Recipe Icon" class="save-recipe-icon">
      </div>
      <h3>${recipe.title}</h3>
    `
    recipeCard.setAttribute('data-recipe', recipe.id)
    spoonacularContainer.appendChild(recipeCard)
  })
  attachEventListeners()
} 
