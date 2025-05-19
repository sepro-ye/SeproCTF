import Alpine from "alpinejs";
import dayjs from "dayjs";

import CTFd from "./index";
import highlight from "./theme/highlight";

function addTargetBlank(html) {
  let dom = new DOMParser();
  let view = dom.parseFromString(html, "text/html");
  let links = view.querySelectorAll('a[href*="://"]');
  links.forEach(link => {
    link.setAttribute("target", "_blank");
  });
  return view.documentElement.outerHTML;
}

// Format numbers with commas as thousands separators
function formatNumber(num) {
  // Handle various input types
  if (num === undefined || num === null) return '0';
  if (typeof num === 'string') {
    // Try to parse the string as a number, removing any non-numeric characters
    const cleanedNum = num.replace(/[^\d.-]/g, '');
    num = parseFloat(cleanedNum) || 0;
  }
  
  // Format the number with commas
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Helper function to get score from API
function getScoreFromAPI() {
  return new Promise((resolve, reject) => {
    CTFd.fetch('/api/v1/users/me')
      .then(response => response.json())
      .then(apiResponse => {
        if (apiResponse.success && apiResponse.data) {
          resolve(apiResponse.data.score || 0);
        } else {
          reject('Could not retrieve score from API');
        }
      })
      .catch(error => {
        reject(error);
      });
  });
}

window.Alpine = Alpine;

// Format the score on page load
document.addEventListener('DOMContentLoaded', () => {
  try {
    const scoreElement = document.querySelector('.score-value');
    if (scoreElement) {
      // Get the score from the data-value attribute if available, or from text content
      const scoreText = scoreElement.getAttribute('data-value') || scoreElement.textContent.trim();
      let score = 0;
      
      // Handle various formats (comma separated numbers, etc)
      if (scoreText) {
        // Remove any non-numeric characters except decimal points
        const cleanedScore = scoreText.replace(/[^\d.-]/g, '');
        score = parseInt(cleanedScore);
      }
      
      // If we have a valid score (including 0)
      if (!isNaN(score)) {
        // Set data-original-score attribute for reference in future updates
        scoreElement.setAttribute('data-original-score', score);
        scoreElement.setAttribute('data-value', score);
        
        // Format with thousand separators (even for 0)
        scoreElement.textContent = formatNumber(score);
        
        // Add subtle entrance animation
        setTimeout(() => {
          scoreElement.classList.add('animate-in');
        }, 300);
        
        // Also check if we need to update the score from the API
        // This ensures the displayed score is always the most current
        setTimeout(() => {
          // Get the most up-to-date score from the API
          CTFd.fetch('/api/v1/users/me')
            .then(response => response.json())
            .then(apiResponse => {
              if (apiResponse.success && apiResponse.data && 
                  apiResponse.data.score !== undefined && 
                  apiResponse.data.score !== parseInt(scoreElement.getAttribute('data-original-score'))) {
                // Score from API is different, update it
                const apiScore = apiResponse.data.score;
                scoreElement.textContent = formatNumber(apiScore);
                scoreElement.setAttribute('data-original-score', apiScore);
                scoreElement.setAttribute('data-value', apiScore);
              }
            })
            .catch(error => {
              console.error('Error fetching user data during initialization:', error);
            });
        }, 1000);
      }
    }
  } catch (error) {
    console.error('Error initializing score display:', error);
  }
});

Alpine.store("challenge", {
  data: {
    view: "",
  },
});

// Add tooltip directive for Tailwind
Alpine.directive('tooltip', (el, { expression }, { evaluateLater, effect }) => {
  const getTooltipText = evaluateLater(expression);
  
  // Create tooltip element
  const tooltip = document.createElement('div');
  tooltip.className = 'absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-md shadow-sm opacity-0 transition-opacity duration-200 pointer-events-none';
  tooltip.style.top = '-30px';
  tooltip.style.left = '50%';
  tooltip.style.transform = 'translateX(-50%)';
  
  // Add arrow
  const arrow = document.createElement('div');
  arrow.className = 'absolute w-2 h-2 bg-gray-900 transform rotate-45';
  arrow.style.bottom = '-4px';
  arrow.style.left = 'calc(50% - 4px)';
  
  // Add tooltip to element
  el.style.position = 'relative';
  tooltip.appendChild(arrow);
  el.appendChild(tooltip);
  
  // Show/hide functions
  function show() {
    getTooltipText(value => {
      tooltip.textContent = value;
      tooltip.appendChild(arrow);
      tooltip.classList.remove('opacity-0');
      tooltip.classList.add('opacity-100');
    });
  }
  
  function hide() {
    tooltip.classList.remove('opacity-100');
    tooltip.classList.add('opacity-0');
  }
  
  // Add event listeners
  el.addEventListener('mouseenter', show);
  el.addEventListener('mouseleave', hide);
  el.addEventListener('focus', show);
  el.addEventListener('blur', hide);
});

Alpine.data("Hint", () => ({
  id: null,
  html: null,

  async showHint(event) {
    if (event.target.open) {
      let response = await CTFd.pages.challenge.loadHint(this.id);
      let hint = response.data;
      if (hint.content) {
        this.html = addTargetBlank(hint.html);
      } else {
        let answer = await CTFd.pages.challenge.displayUnlock(this.id);
        if (answer) {
          let unlock = await CTFd.pages.challenge.loadUnlock(this.id);

          if (unlock.success) {
            let response = await CTFd.pages.challenge.loadHint(this.id);
            let hint = response.data;
            this.html = addTargetBlank(hint.html);
          } else {
            event.target.open = false;
            CTFd._functions.challenge.displayUnlockError(unlock);
          }
        } else {
          event.target.open = false;
        }
      }
    }
  },
}));

Alpine.data("Challenge", () => ({
  id: null,
  next_id: null,
  submission: "",
  activeTab: "challenge",
  solves: [],
  response: null,
  share_url: null,
  max_attempts: 0,
  attempts: 0,
  isSubmitting: false,

  async init() {
    highlight();
  },

  closeModal() {
    const modal = document.getElementById("challenge-window");
    modal.classList.add("hidden");
    // Remove location hash
    history.replaceState(null, null, " ");
  },

  async showChallenge() {
    this.activeTab = "challenge";
  },

  async showSolves() {
    this.solves = await CTFd.pages.challenge.loadSolves(this.id);
    this.solves.forEach(solve => {
      solve.date = dayjs(solve.date).format("MMMM Do, h:mm:ss A");
      return solve;
    });
    this.activeTab = "solves";
  },

  getNextId() {
    let data = Alpine.store("challenge").data;
    return data.next_id;
  },

  async nextChallenge() {
    const modal = document.getElementById("challenge-window");
    modal.classList.add("hidden");
    
    // Dispatch load-challenge event to call loadChallenge in the ChallengeBoard
    setTimeout(() => {
      this.$dispatch("load-challenge", this.getNextId());
    }, 100);
  },

  async getShareUrl() {
    let body = {
      type: "solve",
      challenge_id: this.id,
    };
    const response = await CTFd.fetch("/api/v1/shares", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await response.json();
    const url = data["data"]["url"];
    this.share_url = url;
  },

  copyShareUrl() {
    navigator.clipboard.writeText(this.share_url);
    
    // Flash the tooltip message
    const copyBtn = this.$el.querySelector('button[x-tooltip]');
    if (copyBtn) {
      const mouseEnter = new MouseEvent('mouseenter');
      copyBtn.dispatchEvent(mouseEnter);
      
      setTimeout(() => {
        const mouseLeave = new MouseEvent('mouseleave');
        copyBtn.dispatchEvent(mouseLeave);
      }, 2000);
    }
  },

  async submitChallenge() {
    // Show loading state
    this.isSubmitting = true;
    
    this.response = await CTFd.pages.challenge.submitChallenge(
      this.id,
      this.submission,
    );

    await this.renderSubmissionResponse();
    
    // Hide loading state
    this.isSubmitting = false;
  },

  async renderSubmissionResponse() {
    if (this.response.data.status === "correct") {
      this.submission = "";
      
      // Add celebration animation
      setTimeout(() => {
        const confettiElements = document.querySelectorAll('.confetti-container');
        confettiElements.forEach(el => {
          el.classList.add('active');
          setTimeout(() => {
            el.classList.remove('active');
          }, 3000);
        });
      }, 200);
    }

    // Increment attempts counter
    if (this.max_attempts > 0 && this.response.data.status != "already_solved") {
      this.attempts += 1;
    }

    // Add animation class to flag input
    const flagInput = document.getElementById('challenge-input');
    if (flagInput) {
      if (this.response.data.status === "correct") {
        flagInput.classList.add('correct');
        setTimeout(() => flagInput.classList.remove('incorrect'), 100);
      } else if (this.response.data.status === "incorrect") {
        flagInput.classList.add('incorrect');
        
        // Add shake animation
        flagInput.classList.add('shake-animation');
        setTimeout(() => flagInput.classList.remove('shake-animation'), 500);
      }
    }

    // Dispatch load-challenges event to call loadChallenges in the ChallengeBoard
    this.$dispatch("load-challenges");
    
    // Use setTimeout to ensure the score updates after a slight delay
    if (this.response.data.status === "correct") {
      setTimeout(() => {
        try {
          const challengeBoard = document.querySelector('[x-data="ChallengeBoard"]');
          
          if (challengeBoard && challengeBoard.__x && challengeBoard.__x.$data) {
            const boardData = challengeBoard.__x.$data;
            
            // Get the exact value of the challenge that was just solved
            const challengeValue = this.response.data.value;
            const challengeId = this.response.data.challenge || this.id;
            
            // Log for debugging
            console.log('Challenge solved:', {
              id: challengeId,
              value: challengeValue,
              status: this.response.data.status
            });
            
            if (typeof boardData.updateScoreDisplay === 'function') {
              if (challengeValue !== undefined && challengeValue !== null && !isNaN(parseInt(challengeValue))) {
                // If we have the challenge value, update immediately with the exact value
                boardData.updateScoreDisplay(parseInt(challengeValue));
              } else {
                // If we couldn't get the exact value, try to find it from the challenges list
                const solvedChallenge = boardData.challenges.find(c => c.id === challengeId);
                
                if (solvedChallenge && solvedChallenge.value !== undefined && !isNaN(parseInt(solvedChallenge.value))) {
                  // Use the value from the challenges list
                  boardData.updateScoreDisplay(parseInt(solvedChallenge.value));
                } else {
                  // If all else fails, request a complete score refresh
                  boardData.updateScoreDisplay(0, true);
                }
              }
            }
          } else {
            // Fallback if challenge board is not available - update manually
            const scoreElement = document.querySelector('.score-value');
            if (scoreElement) {
              // Force a refresh via the API since we can't access the board directly
              CTFd.fetch('/api/v1/users/me')
                .then(response => response.json())
                .then(apiResponse => {
                  if (apiResponse.success && apiResponse.data) {
                    const newScore = apiResponse.data.score || 0;
                    scoreElement.textContent = formatNumber(newScore);
                    scoreElement.setAttribute('data-original-score', newScore);
                    scoreElement.setAttribute('data-value', newScore);
                  }
                });
            }
          }
        } catch (error) {
          console.error('Error updating score after challenge solve:', error);
        }
      }, 300);
    }
  },
}));

Alpine.data("ChallengeBoard", () => ({
  loaded: false,
  challenges: [],
  challenge: null,
  currentFilter: 'all',
  recentChallenges: new Set(),

  async init() {
    this.challenges = await CTFd.pages.challenges.getChallenges();
    this.loaded = true;
    
    // Make sure score is properly formatted on initial load
    this.updateScoreDisplay();
    
    // Store recently added challenges for highlighting
    this.challenges.forEach(challenge => {
      if (this.isNewChallenge(challenge.id)) {
        this.recentChallenges.add(challenge.id);
      }
    });

    if (window.location.hash) {
      let chalHash = decodeURIComponent(window.location.hash.substring(1));
      let idx = chalHash.lastIndexOf("-");
      if (idx >= 0) {
        let pieces = [chalHash.slice(0, idx), chalHash.slice(idx + 1)];
        let id = pieces[1];
        await this.loadChallenge(id);
      }
    }
  },

  // Function to check if a challenge is newly added (within 7 days)
  isNewChallenge(challengeId) {
    const challenge = this.challenges.find(c => c.id === Number(challengeId));
    if (!challenge) return false;
    
    // For demo purposes, randomly mark some challenges as new
    // In production, you would use real dates: 
    // const challengeDate = dayjs(challenge.date);
    // const now = dayjs();
    // return now.diff(challengeDate, 'day') <= 7;
    return challengeId % 3 === 0; // Mark every third challenge as new
  },

  getChallengeIcon(category) {
    // Get appropriate icon for challenge category
    const iconMap = {
      'Web': 'fas fa-globe',
      'Crypto': 'fas fa-key',
      'Forensics': 'fas fa-search',
      'Binary': 'fas fa-microchip',
      'Pwn': 'fas fa-bug',
      'Reverse': 'fas fa-undo',
      'Misc': 'fas fa-puzzle-piece',
    };
    
    return iconMap[category] || 'fas fa-shield-alt';
  },

  getDifficultyRating(points) {
    // Convert points to difficulty rating from 1-5
    if (points < 150) return 1;
    if (points < 250) return 2;
    if (points < 350) return 3;
    if (points < 450) return 4;
    return 5;
  },

  getCategories() {
    const categories = [];

    this.challenges.forEach(challenge => {
      const { category } = challenge;

      if (!categories.includes(category)) {
        categories.push(category);
      }
    });

    try {
      const f = CTFd.config.themeSettings.challenge_category_order;
      if (f) {
        const getSort = new Function(`return (${f})`);
        categories.sort(getSort());
      }
    } catch (error) {
      // Ignore errors with theme category sorting
      console.log("Error running challenge_category_order function");
      console.log(error);
    }

    return categories;
  },

  getChallenges(category) {
    let challenges = this.challenges;

    if (category !== null) {
      challenges = this.challenges.filter(challenge => challenge.category === category);
    }

    try {
      const f = CTFd.config.themeSettings.challenge_order;
      if (f) {
        const getSort = new Function(`return (${f})`);
        challenges.sort(getSort());
      }
    } catch (error) {
      // Ignore errors with theme challenge sorting
      console.log("Error running challenge_order function");
      console.log(error);
    }

    return challenges;
  },

  async loadChallenges() {
    this.challenges = await CTFd.pages.challenges.getChallenges();
    this.updateScoreDisplay();
  },
  
  // Helper function to update the score display with animation
  // addedScore parameter is optional - if provided, will add to current score immediately
  // forceRefresh parameter is optional - if true, will always fetch from API even if addedScore is provided
  updateScoreDisplay(addedScore = 0, forceRefresh = false) {
    const scoreElement = document.querySelector('.score-value');
    if (!scoreElement) return;
    
    // If we have an immediate score to add and don't need to force refresh, update directly
    if (addedScore > 0 && !forceRefresh) {
      const currentScore = parseInt(scoreElement.getAttribute('data-original-score') || '0');
      const newScore = currentScore + addedScore;
      
      // Update the score display immediately
      scoreElement.textContent = formatNumber(newScore);
      scoreElement.setAttribute('data-original-score', newScore);
      scoreElement.setAttribute('data-value', newScore); // Update data-value for consistency
      scoreElement.classList.remove('animate-in');
      void scoreElement.offsetWidth; // Force reflow
      scoreElement.classList.add('animate-in');
      
      // Update progress bar percentage immediately
      const progressBar = document.querySelector('.progress-bar');
      const maxScoreElement = document.querySelector('.mt-2.text-xs.text-gray-400.flex.justify-between span:last-child');
      
      if (progressBar && maxScoreElement) {
        const maxScore = parseInt(maxScoreElement.textContent);
        if (!isNaN(maxScore) && maxScore > 0) {
          const percentage = Math.min((newScore / maxScore) * 100, 100);
          progressBar.style.width = `${percentage}%`;
        }
      }
      
      return;
    }
    
    // Try multiple API endpoints to ensure we get the most accurate score
    // First attempt to use /api/v1/users/me/score (most direct)
    CTFd.fetch('/api/v1/users/me')
      .then(response => response.json())
      .then(apiResponse => {
        if (apiResponse.success && apiResponse.data) {
          // Get the score directly from the user data
          const newScore = apiResponse.data.score || 0;
          const oldScore = parseInt(scoreElement.getAttribute('data-original-score') || '0');
          
          // Store original score for reference
          scoreElement.setAttribute('data-original-score', newScore);
          scoreElement.setAttribute('data-value', newScore);
          
          // Update the display with animation only if the score has changed
          if (newScore !== oldScore) {
            scoreElement.textContent = formatNumber(newScore);
            scoreElement.classList.remove('animate-in');
            void scoreElement.offsetWidth; // Force reflow
            scoreElement.classList.add('animate-in');
            
            // Update progress bar percentage
            const progressBar = document.querySelector('.progress-bar');
            const maxScoreElement = document.querySelector('.mt-2.text-xs.text-gray-400.flex.justify-between span:last-child');
            
            if (progressBar && maxScoreElement) {
              const maxScore = parseInt(maxScoreElement.textContent);
              if (!isNaN(maxScore) && maxScore > 0) {
                const percentage = Math.min((newScore / maxScore) * 100, 100);
                progressBar.style.width = `${percentage}%`;
              }
            }
          }
        } else {
          // Fallback to scoreboard API if user API fails
          CTFd.api.get_scoreboard_list().then(response => {
            if (response.success) {
              const currentUser = response.data.find(team => team.me);
              if (currentUser) {
                const newScore = currentUser.score || 0;
                const oldScore = parseInt(scoreElement.getAttribute('data-original-score') || '0');
                
                // Update score and UI
                if (newScore !== oldScore) {
                  scoreElement.setAttribute('data-original-score', newScore);
                  scoreElement.setAttribute('data-value', newScore);
                  scoreElement.textContent = formatNumber(newScore);
                  
                  // Animation and progress bar update
                  scoreElement.classList.remove('animate-in');
                  void scoreElement.offsetWidth;
                  scoreElement.classList.add('animate-in');
                  
                  // Update progress bar
                  const progressBar = document.querySelector('.progress-bar');
                  const maxScoreElement = document.querySelector('.mt-2.text-xs.text-gray-400.flex.justify-between span:last-child');
                  
                  if (progressBar && maxScoreElement) {
                    const maxScore = parseInt(maxScoreElement.textContent);
                    if (!isNaN(maxScore) && maxScore > 0) {
                      const percentage = Math.min((newScore / maxScore) * 100, 100);
                      progressBar.style.width = `${percentage}%`;
                    }
                  }
                }
              }
            }
          }).catch(error => {
            console.error('Failed to fetch score data:', error);
          });
        }
      })
      .catch(error => {
        console.error('Error fetching user score data:', error);
      });
  },

  async loadChallenge(challengeId) {
    await CTFd.pages.challenge.displayChallenge(challengeId, challenge => {
      challenge.data.view = addTargetBlank(challenge.data.view);
      Alpine.store("challenge").data = challenge.data;

      // nextTick is required here because we're working in a callback
      Alpine.nextTick(() => {
        const modal = document.getElementById("challenge-window");
        modal.classList.remove("hidden");
        history.replaceState(null, null, `#${challenge.data.name}-${challengeId}`);
      });
    });
  },
}));

Alpine.start();
