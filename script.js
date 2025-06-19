const BASE_API = window.BASE_API_URL || 'http://localhost:3000'

let currentPage = 1 
const recipesPerPage = 12 
let currentQuery = '' 
let totalResults = 0 
const spoonacularContainer = document.querySelector('.recipe-cards-section')

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
            displayModal({
                title,
                image,
                instructions: recipeInstructions.instructions,
                ingredients: recipeInstructions.ingredients
            })
        })
    })
}

function displayModal(recipe){
    console.log(recipe.ingredients)
    const modalOverlay = document.createElement('div');
    modalOverlay.classList.add('modal-overlay');
    const modal = document.createElement('div');
    modal.classList.add('modal')
     
    modal.innerHTML = `
        <div class="modal-header">
            <div class="title">${recipe.title}</div>
            <button class="close-modal">X</button>
        </div>
        <img src="${recipe.image}" alt="${recipe.title}" class="modal-image" />
        <div class="modal-body">
            <h2>Instructions</h2>
            ${recipe.instructions.map(instruction => `<p><strong>Step ${instruction.number}:</strong> ${instruction.step}</p>`).join('')}
            <h2>Ingredients</h2>
            <ul>
                ${recipe.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
            </ul>
        </div>`
    
    modalOverlay.appendChild(modal)
    document.body.appendChild(modalOverlay)
    document.body.style.overflow = 'hidden'

    modalOverlay.querySelector('.close-modal').addEventListener('click', () => {
    modalOverlay.remove()
    document.body.style.overflow = ''
    })
}

async function displayRecipeData(recipeId){
    const apiEndpoint = `${BASE_API}/api/recipes/${recipeId}/instructions`
    if(!apiEndpoint) return 
    const apiData = await fetch(apiEndpoint)
    const data = await apiData.json()
    console.log(data)
    return data
}

function displayCategories(){
    const categories = document.querySelectorAll('[data-category]')
    categories.forEach(category => {
        category.addEventListener('click', async () => {
            const categoryName = category.dataset.category
            const {recipes, totalResults} = await fetchRecipes(categoryName, 1, true)
            displayRecipes(recipes)
            displayLoaderButton(recipes, totalResults)
        })
    })
}

displayCategories()

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

function displayLoaderButton(recipes, totalResults){
    if(!recipes || !Array.isArray(recipes)){
        loadMoreButton.style.display = 'none'
        return
    }
    if(totalResults > recipes.length){
        loadMoreButton.style.display = 'block'
    } else {
        loadMoreButton.style.display = 'none'
    }
}

loadMoreButton.addEventListener('click', loadMoreRecipes)

async function loadMoreRecipes(){
   const maxLoadableRecipes = 60
   const newRecipesPage = currentPage + 1
   currentPage = newRecipesPage 
   loadMoreButton.disabled = true
   const fetchedNewRecipes = await fetchRecipes(currentQuery, currentPage)
   if(!fetchedNewRecipes){
    loadMoreButton.disabled = false
    return
   }
   totalResults = fetchedNewRecipes.totalResults
   appendRecipes(fetchedNewRecipes.recipes)
   const loadedRecipes = currentPage * recipesPerPage

    if(loadedRecipes < totalResults && loadedRecipes < maxLoadableRecipes){
       loadMoreButton.disabled = false
   } else {
       loadMoreButton.style.display = 'none'
   }    
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