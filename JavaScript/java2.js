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
            transitionColor: '#000000' // Couleur de base pour la transition du portail 1
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
            transitionColor: '#b41010' // Couleur de base pour la transition du portail 2
        }
    };

    let activeFloatingImages = [];
    let currentPortalId = null; 
    let animationFrameId = null; // Pour stocker l'ID de la boucle d'animation

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

        // Arrêter toute boucle d'animation précédente
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null; // Réinitialiser l'ID
        }
        
        // Applique la couleur de transition du portail choisi
        transitionEffect.style.backgroundColor = experience.transitionColor;
        
        homeScreen.classList.add('hidden'); 
        transitionEffect.classList.add('active'); // Rend la transition visible (opaque)

        // Durée de la transition pour que l'écran soit complètement couvert
        const transitionDuration = 500; // Doit correspondre à la transition CSS (0.5s)

        setTimeout(() => {
            experienceScreen.classList.add('active'); 
            experienceScreen.classList.add(experience.ambianceClass); 

            backgroundEyeImage.style.backgroundImage = `url(${experience.eyeImage})`;
            backgroundEyeImage.classList.add('active'); 

            imagesFloatingContainer.classList.add('active'); 
            createFloatingImages(experience.floatingImages);

            transitionEffect.classList.remove('active'); // Cache la transition après avoir chargé l'expérience

            musicPlayer.src = experience.music;
            musicPlayer.load();
            musicPlayer.play().then(() => {
                audioContext.resume();
                animateLoop(); // Démarre la nouvelle boucle d'animation
                console.log(`Expérience ${portalKey} démarrée !`);
            }).catch(error => {
                console.error(`Erreur de lecture audio pour ${portalKey}:`, error);
                // Si la lecture échoue (ex: autoplay bloqué), on peut aussi forcer endExperience
                endExperience(); 
            });

            musicPlayer.onended = () => {
                console.log(`Musique de ${portalKey} terminée.`);
                endExperience();
            };

            // Optionnel : Forcer la fin après X secondes si la musique est en boucle ou n'a pas d'événement 'onended' fiable
            // setTimeout(endExperience, 30000); 
        }, transitionDuration); // Attendre la fin du fondu pour charger le contenu
    }

    portal1.addEventListener('click', (e) => startExperience('portal1', e));
    portal2.addEventListener('click', (e) => startExperience('portal2', e));

    // --- Floating Image Creation ---
    function createFloatingImages(imagesData) {
        // Supprime les anciennes images flottantes
        activeFloatingImages.forEach(el => el.remove());
        activeFloatingImages = [];
        imagesFloatingContainer.innerHTML = ''; 

        imagesData.forEach(src => {
            const imgDiv = document.createElement('div');
            imgDiv.className = 'floating-image-item';
            imgDiv.style.backgroundImage = `url(${src})`;

            // Positionnement initial aléatoire
            imgDiv.style.left = `${Math.random() * (window.innerWidth - 150)}px`;
            imgDiv.style.top = `${Math.random() * (window.innerHeight - 150)}px`;
            
            // Vitesses et rotation aléatoires
            imgDiv.dataset.speedX = (Math.random() - 0.5) * 3; 
            imgDiv.dataset.speedY = (Math.random() - 0.5) * 3;
            imgDiv.dataset.rotation = Math.random() * 360;
            imgDiv.dataset.rotationSpeed = (Math.random() - 0.5) * 0.5;

            imagesFloatingContainer.appendChild(imgDiv);
            activeFloatingImages.push(imgDiv);
        });
    }

    // --- End Experience Logic (Fondu au retour) ---
    function endExperience() {
        musicPlayer.pause();
        musicPlayer.currentTime = 0; 

        // Arrêter la boucle d'animation
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null; // Réinitialiser l'ID
        }

        imagesFloatingContainer.classList.remove('active'); 
        backgroundEyeImage.classList.remove('active'); 
        
        // Supprime la classe d'ambiance spécifique du monde avant de potentiellement en ajouter une nouvelle
        if (currentPortalId) {
            experienceScreen.classList.remove(portalAssets[currentPortalId].ambianceClass); 
        }
        experienceScreen.classList.remove('active'); 

        // Rendre la transition active pour couvrir l'écran avant de revenir à l'accueil
        // Utilise la couleur du portail actuel pour la transition de retour
        if (currentPortalId) { // S'assurer qu'un portail était actif
            transitionEffect.style.backgroundColor = portalAssets[currentPortalId].transitionColor; 
        } else {
            transitionEffect.style.backgroundColor = '#000000'; // Fallback au noir
        }
        transitionEffect.classList.add('active'); // Devient opaque

        const transitionDuration = 500; // Doit correspondre à la transition CSS (0.5s)

        setTimeout(() => {
            homeScreen.classList.remove('hidden');
            transitionEffect.classList.remove('active'); // Cache la transition une fois que l'écran d'accueil est visible
            currentPortalId = null; // Réinitialiser le portail actif
            backgroundEyeImage.style.backgroundImage = 'none'; // Effacer l'image de fond
            console.log("Retour à l'écran d'accueil.");
        }, transitionDuration); 
    }

    // --- Main Animation Loop ---
    function animateLoop() {
        // Stocke l'ID de cette requête pour pouvoir l'annuler plus tard
        animationFrameId = requestAnimationFrame(animateLoop); 

        // Si l'audio n'est pas prêt ou qu'aucun portail n'est actif, arrêter la boucle ici.
        // Cela devrait être géré par `cancelAnimationFrame` mais une sécurité ne fait pas de mal.
        if (!audioContext || audioContext.state === 'suspended' || !currentPortalId) {
            // Si l'animation ne devrait plus tourner, annuler la prochaine frame
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            return; 
        }

        analyser.getByteFrequencyData(dataArray);
        let averageVolume = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;

        // --- Canvas Visualizer (Simple halo pulsant) ---
        ctx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
        
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

            // La vitesse est influencée par le volume audio
            let speedMultiplier = 1 + (averageVolume / 100); 
            if (currentPortalId === 'portal2') speedMultiplier *= 1.5; // Vitesse accrue pour le portail 2

            currentLeft += parseFloat(imgDiv.dataset.speedX) * speedMultiplier;
            currentTop += parseFloat(imgDiv.dataset.speedY) * speedMultiplier;
            currentRotation += parseFloat(imgDiv.dataset.rotationSpeed) * speedMultiplier;

            // Détection des bords de l'écran pour rebondir
            if (currentLeft + imgDiv.offsetWidth > window.innerWidth || currentLeft < 0) {
                imgDiv.dataset.speedX *= -1;
                // Ajustement pour éviter de rester bloqué sur le bord
                currentLeft = Math.max(0, Math.min(currentLeft, window.innerWidth - imgDiv.offsetWidth)); 
            }
            if (currentTop + imgDiv.offsetHeight > window.innerHeight || currentTop < 0) {
                imgDiv.dataset.speedY *= -1;
                // Ajustement pour éviter de rester bloqué sur le bord
                currentTop = Math.max(0, Math.min(currentTop, window.innerHeight - imgDiv.offsetHeight));
            }

            imgDiv.style.left = `${currentLeft}px`;
            imgDiv.style.top = `${currentTop}px`;
            imgDiv.style.transform = `rotate(${currentRotation}deg)`;

            // Effets visuels spécifiques aux portails
            if (currentPortalId === 'portal1') {
                imgDiv.style.filter = `blur(${averageVolume / 100}px)`; // Flou selon le volume
            } else if (currentPortalId === 'portal2') {
                imgDiv.style.filter = `hue-rotate(${averageVolume * 1.5}deg)`; // Changement de teinte selon le volume
            }
        });
    }
});