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

window.Alpine = Alpine;

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
    this.response = await CTFd.pages.challenge.submitChallenge(
      this.id,
      this.submission,
    );

    await this.renderSubmissionResponse();
  },

  async renderSubmissionResponse() {
    if (this.response.data.status === "correct") {
      this.submission = "";
    }

    // Increment attempts counter
    if (this.max_attempts > 0 && this.response.data.status != "already_solved") {
      this.attempts += 1;
    }

    // Dispatch load-challenges event to call loadChallenges in the ChallengeBoard
    this.$dispatch("load-challenges");
  },
}));

Alpine.data("ChallengeBoard", () => ({
  loaded: false,
  challenges: [],
  challenge: null,

  async init() {
    this.challenges = await CTFd.pages.challenges.getChallenges();
    this.loaded = true;

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
