document.addEventListener('DOMContentLoaded', () => {
    const homeScreen = document.getElementById('homeScreen');
    const portal1 = document.getElementById('portal1');
    const portal2 = document.getElementById('portal2');
    const transitionEffect = document.getElementById('transitionEffect');
    const experienceScreen = document.getElementById('experienceScreen');
    const visualizerCanvas = document.getElementById('visualizerCanvas');
    const ctx = visualizerCanvas.getContext('2d');
    const backgroundEyeImage = document.getElementById('backgroundEyeImage'); 
    const imagesFloatingContainer = document.getElementById('imagesFloatingContainer');
    const musicPlayer = document.getElementById('musicPlayer');

    // --- Tes assets pour chaque portail ---
    const portalAssets = {
        portal1: {
            music: portal1.dataset.music,
            eyeImage: portal1.dataset.eyeImage, 
            floatingImages: [
                'pics/1.jpg', 'pics/2.jpg', 'pics/3.jpg', 'pics/4.jpg', 'pics/5.jpg',
                'pics/6.jpg', 'pics/7.jpg','pics/8.jpg', 'pics/9.jpg', 'pics/10.jpg', 'pics/11.jpg', 'pics/12.jpg',
                'pics/13.jpg', 'pics/14.jpg', 'pics/15.jpg', 'pics/16.jpg', 'pics/17.png'
            ],
            ambianceClass: 'world1',
            transitionColor: '#000000' 
        },
        portal2: {
            music: portal2.dataset.music,
            eyeImage: portal2.dataset.eyeImage,
            floatingImages: [
                'pics/20.jpg', 'pics/21.webp', 'pics/22.jpeg', 'pics/23.jpeg', 'pics/24.jpg',
                'pics/25.jpg', 'pics/26.jpg', 'pics/27.jpg', 'pics/28.jpg', 'pics/29.png', 'pics/30.jpg',
                'pics/31.jpg'
            ],
            ambianceClass: 'world2',
            transitionColor: '#b41010' 
        }
    };

    let activeFloatingImages = [];
    let currentPortalId = null; 
    let currentClickedPosition = { x: 0, y: 0 }; 

    // --- Audio Context Setup ---
    let audioContext;
    let analyser;
    let dataArray;
    let bufferLength;

    function setupAudio() {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        const source = audioContext.createMediaElementSource(musicPlayer);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
    }

    // --- Canvas Resizing ---
    function resizeCanvas() {
        visualizerCanvas.width = window.innerWidth;
        visualizerCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // --- Start Experience ---
    function startExperience(portalKey, event) {
        if (!audioContext) {
            setupAudio();
        }
        
        currentPortalId = portalKey;
        const experience = portalAssets[portalKey];

        currentClickedPosition = { x: event.clientX, y: event.clientY };
        transitionEffect.style.setProperty('--click-x', `${event.clientX}px`);
        transitionEffect.style.setProperty('--click-y', `${event.clientY}px`);
        transitionEffect.style.backgroundColor = experience.transitionColor;
        
        homeScreen.classList.add('hidden'); 
        transitionEffect.classList.remove('hidden-post-transition'); 
        transitionEffect.classList.add('active'); 

        setTimeout(() => {
            experienceScreen.classList.add('active'); 
            experienceScreen.classList.add(experience.ambianceClass); 

            backgroundEyeImage.style.backgroundImage = `url(${experience.eyeImage})`;
            backgroundEyeImage.classList.add('active'); 

            imagesFloatingContainer.classList.add('active'); 
            createFloatingImages(experience.floatingImages);

            transitionEffect.classList.add('hidden-post-transition'); 

            musicPlayer.src = experience.music;
            musicPlayer.load();
            musicPlayer.play().then(() => {
                audioContext.resume();
                animateLoop(); 
                console.log(`Expérience ${portalKey} démarrée !`);
            }).catch(error => {
                console.error(`Erreur de lecture audio pour ${portalKey}:`, error);
            });

            musicPlayer.onended = () => {
                console.log(`Musique de ${portalKey} terminée.`);
                endExperience();
            };

            // Optionnel : Forcer la fin après X secondes si la musique est en boucle
            // setTimeout(endExperience, 30000); 
        }, 800); 
    }

    portal1.addEventListener('click', (e) => startExperience('portal1', e));
    portal2.addEventListener('click', (e) => startExperience('portal2', e));

    // --- Floating Image Creation ---
    function createFloatingImages(imagesData) {
        activeFloatingImages.forEach(el => el.remove());
        activeFloatingImages = [];
        imagesFloatingContainer.innerHTML = ''; 

        imagesData.forEach(src => {
            const imgDiv = document.createElement('div');
            imgDiv.className = 'floating-image-item';
            imgDiv.style.backgroundImage = `url(${src})`;

            imgDiv.style.left = `${Math.random() * (window.innerWidth - 150)}px`;
            imgDiv.style.top = `${Math.random() * (window.innerHeight - 150)}px`;
            
            imgDiv.dataset.speedX = (Math.random() - 0.5) * 3; 
            imgDiv.dataset.speedY = (Math.random() - 0.5) * 3;
            imgDiv.dataset.rotation = Math.random() * 360;
            imgDiv.dataset.rotationSpeed = (Math.random() - 0.5) * 0.5;

            imagesFloatingContainer.appendChild(imgDiv);
            activeFloatingImages.push(imgDiv);
        });
    }

    // --- End Experience Logic (Dézoom du vortex) ---
    function endExperience() {
        musicPlayer.pause();
        musicPlayer.currentTime = 0; 

        imagesFloatingContainer.classList.remove('active'); 
        backgroundEyeImage.classList.remove('active'); 
        experienceScreen.classList.remove(portalAssets[currentPortalId].ambianceClass); 
        experienceScreen.classList.remove('active'); 

        transitionEffect.classList.remove('active');
        transitionEffect.classList.remove('hidden-post-transition'); 
        transitionEffect.classList.add('reverse'); 

        setTimeout(() => {
            homeScreen.classList.remove('hidden');
            transitionEffect.classList.remove('reverse'); 
            currentPortalId = null;
            backgroundEyeImage.style.backgroundImage = 'none'; 
            console.log("Retour à l'écran d'accueil.");
        }, 1300); 
    }

    // --- Main Animation Loop ---
    function animateLoop() {
        requestAnimationFrame(animateLoop);

        if (!audioContext || audioContext.state === 'suspended' || !currentPortalId) return;

        analyser.getByteFrequencyData(dataArray);
        let averageVolume = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;

        // --- Canvas Visualizer (Simple halo pulsant, pas de barre) ---
        ctx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
        
        // Un halo très subtil au centre, réagissant au volume
        if (currentPortalId) {
            ctx.fillStyle = `rgba(255, 255, 255, ${averageVolume / 500})`; 
            const pulseRadius = averageVolume / 2;
            ctx.beginPath();
            ctx.arc(visualizerCanvas.width / 2, visualizerCanvas.height / 2, pulseRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        // --- Animation des Images Flottantes ---
        activeFloatingImages.forEach(imgDiv => {
            let currentLeft = parseFloat(imgDiv.style.left);
            let currentTop = parseFloat(imgDiv.style.top);
            let currentRotation = parseFloat(imgDiv.dataset.rotation);

            let speedMultiplier = 1 + (averageVolume / 100); 
            if (currentPortalId === 'portal2') speedMultiplier *= 1.5; 

            currentLeft += parseFloat(imgDiv.dataset.speedX) * speedMultiplier;
            currentTop += parseFloat(imgDiv.dataset.speedY) * speedMultiplier;
            currentRotation += parseFloat(imgDiv.dataset.rotationSpeed) * speedMultiplier;

            if (currentLeft + imgDiv.offsetWidth > window.innerWidth || currentLeft < 0) {
                imgDiv.dataset.speedX *= -1;
            }
            if (currentTop + imgDiv.offsetHeight > window.innerHeight || currentTop < 0) {
                imgDiv.dataset.speedY *= -1;
            }

            imgDiv.style.left = `${currentLeft}px`;
            imgDiv.style.top = `${currentTop}px`;
            imgDiv.style.transform = `rotate(${currentRotation}deg)`;

            // Effets visuels spécifiques aux portails
            if (currentPortalId === 'portal1') {
                imgDiv.style.filter = `blur(${averageVolume / 100}px)`;
            } else if (currentPortalId === 'portal2') {
                imgDiv.style.filter = `hue-rotate(${averageVolume * 1.5}deg)`;
            }
        });
    }
});