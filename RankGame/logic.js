window.AFRankGame = (async function () {
    let timer = null;
    let time = 0;
    let scr = $.HackForm(1);
    if (!scr?.customProps?.handle_br) return;

    let style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
      .gg_fly {
        animation-name: gg_fly;
        animation-duration: 1s;
      }

      @keyframes gg_fly {
        0% {
          transform: translateY(-100px); /* Start off-screen (above) */
          opacity: 0;
        }
        100% {
          transform: translateY(0); /* Move to original position */
          opacity: 1;
        }
      }

      .approve-reject-btn {
        position: absolute;
        top: 10%;
        left: 50%;
        transform: translateX(-50%); /* Center horizontally */
        border: 2px dashed;
        padding: 10px 20px;
        border-radius: 50px;
        background: rgba(255, 255, 255, 0.3); /* Transparent background */
        cursor: pointer;
        opacity: 0.7;
        font-size: 18px;
        font-weight: bold;
        transition: transform 0.3s ease, top 0.5s ease, left 0.5s ease; /* Smooth transitions */
        z-index: 20000;
      }

      .approve-reject-btn:hover {
        transform: translateX(-50%) rotate(0deg); /* Hover effect removes rotation */
      }

      .approve-style {
        border-color: green;
        color: green;
        left: calc(50% - 60px); /* Adjusted left for spacing */
      }
      .reject-style {
        border-color: red;
        color: red;
        left: calc(50% + 60px); /* Adjusted left for spacing */
      }

      /* When the button is clicked */
      .animate-approve {
        transform: translate(-50%, -50%) rotate(-45deg) scale(2); 
        top: 50%;
        left: 50%;
      }
      .animate-reject {
        transform: translate(-50%, -50%) rotate(-45deg) scale(2);
        top: 50%;
        left: 50%;
      }
    `;
    document.getElementsByTagName('head')[0].appendChild(style);

    $.DisplayElement('PROGRESS', false);
    let title = scr?.customProps?.br_title ?? 'Missing Title';
    let subtitle = scr?.customProps?.br_subtitle ?? 'Missing Sub Title';
    let list = scr?.customProps?.br_list?.split("\n") ?? [];
    let total = list?.length;
    let maxcount = scr?.customProps?.br_max ?? 0;

    // Shuffle the list
    for (let i = total - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]]; 
    }

    $.Var('BR_TITLE', title);
    $.Var('BR_SUBTITLE', subtitle);

    let rankedItems = Array(maxcount).fill(null);
    let selectedRanks = [];
    let currentItemIndex = 0;

    window.speak = function(text) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.pitch = 1;
            utterance.rate = 1;
            utterance.volume = 1; 
            utterance.lang = 'en-US';
            window.speechSynthesis.speak(utterance);
        } else {
            console.log('Speech synthesis is not supported in this browser.');
        }
    }

    $.Handle(`screen_1_on_enter`, function() {
        setTimeout(function() {
            speak(title + '.' + subtitle);
            let btn = document.querySelector('#btnStart');
            btn.classList.remove('btn-secondary');
            btn.classList.add('btn-warning');
            btn.addEventListener('click', function() {
                $.PressNext();
            });
        }, 200);
    });

    $.Handle(`screen_2_on_enter`, function() {
        speak('Select the rank for each item!');
        setTimeout(function() {
            let screen = buildGameScreen();
            document.querySelector('.form_text_area').innerHTML = screen;
            speak(`The first item is ${list[currentItemIndex]}.`);
            setTimeout(function() {
              document.querySelector('#currentItem').innerHTML = list[0];
            }, 100);
        }, 200);
    });

    $.Handle(`screen_3_on_enter`, function() {
        setTimeout(function() {
            let approveBtn = document.createElement('button');
            approveBtn.textContent = 'Approve';
            approveBtn.classList.add('approve-reject-btn', 'approve-style');
            approveBtn.addEventListener('click', function() {
                approveBtn.innerHTML = 'APPROVED';
                approveBtn.classList.add('animate-approve');
                speak("List is Approved!");
                setTimeout(() => {
                    rejectBtn.remove(); 
                }, 200); 
            });

            let rejectBtn = document.createElement('button');
            rejectBtn.textContent = 'Reject';
            rejectBtn.classList.add('approve-reject-btn', 'reject-style');
            rejectBtn.addEventListener('click', function() {
                rejectBtn.innerHTML = 'REJECTED';
                rejectBtn.classList.add('animate-reject');
                speak("This List is Rejected!"); 
                setTimeout(() => {
                    approveBtn.remove(); 
                }, 200);
            });

            document.body.appendChild(approveBtn);
            document.body.appendChild(rejectBtn);
        }, 1000);
    });

    window.selectRank = function(rank, event) {
        if (selectedRanks.includes(rank)) {
            return;
        }

        // Remove the button for the selected rank
        event.target.remove();
        selectedRanks.push(rank);
        rankedItems[rank - 1] = list[currentItemIndex];
        currentItemIndex++;

        // Animate the ranked item
        document.querySelector(`#item_${rank}_l`).classList.add('gg_fly');

        // Update ranked items display
        document.querySelector(`#item_${rank}_l`).innerHTML = list[currentItemIndex - 1];

        if (currentItemIndex < total) {
            speak(list[currentItemIndex]); // Speak the next item without "d"
        } else {
            speak('No more items to rank.');
        }

        if (currentItemIndex >= maxcount) {
            speak('Ranking Completed! Please wait!');
            if (timer) {
                clearInterval(timer);
            }
            generateFinalRankList();
        }

      if (currentItemIndex < maxcount) {
            document.querySelector('#currentItem').innerHTML = list[currentItemIndex];
        }
    }

    function generateFinalRankList() {
        let rankedList = `<ol>`;
        rankedItems.forEach((item, index) => {
            rankedList += `<li>${item ? item : 'Not Ranked'}</li>`;
        });
        rankedList += `</ol>`;
        
        $.Var('BR_RANK', rankedList);

        setTimeout(function() {
            document.querySelector('.form_text_area').innerHTML = "<h1> Complete! </h1>";
        }, 1000);
        setTimeout(function() {
            $.PressNext();
        }, 3000);
    }

    function buildGameScreen() {
        let rankButtons = Array.from({ length: maxcount }, (_, i) => `
            <button class="btn btn-lg px-4 btn-outline-secondary shadow" data-key="{${i + 1}}" onclick="selectRank(${i + 1}, event)">${i + 1}</button>`
        ).join('');

        let html = `
        <div class="w-100">
            <h1 class="lead fw-normal">Rank</h1> 
            <div class="mt-2 display-4 fw-bold" id="currentItem"></div>
            <div class="w-100 d-flex flex-wrap my-2 gap-2 br-setup" id="rankArea">
                ${rankButtons}
            </div>
            <div class="mt-3 w-100">
                <div id="rankedItems" class="w-100 row">
                    ${Array.from({ length: maxcount }, (_, i) => `
                        <div class="col-6 lead mb-2 p-2 border-bottom d-flex gap-3 align-items-center" id="item_${i + 1}">
                            <div>${i + 1}.</div>
                            <div id="item_${i + 1}_l"></div>
                        </div>`
                    ).join('')}
                </div>
            </div>
        </div>`;
        
        return html;
    }
})