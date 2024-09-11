console.log('Hello World!');

const canvas: HTMLCanvasElement = document.getElementsByClassName('js-mainCanvas')[0] as HTMLCanvasElement;
const context = canvas.getContext('2d');

interface Point {
    x: number
    y: number
}

interface Circle extends Point {
    r: number
    color?: string
}

interface Hero extends Circle {
    target?: Point
    speed: number
}

interface GameState {
    hero: Hero
}

const state: GameState = {
    hero: {
        x: 50,
        y: 50,
        r: 20,
        speed: 5,
        color: 'red',
    },
};

function update() {
    updateHero(state.hero);
}
// Run update at 50FPS (once every 20 milliseconds).
setInterval(update, 20);

function updateHero(hero: Hero) {
    if (hero.target) {
        // Move hero until it reaches the target.
        const dx = hero.target.x - hero.x, dy = hero.target.y - hero.y;
        const mag = Math.sqrt(dx * dx + dy * dy);
        if (mag < hero.speed) {
            hero.x = hero.target.x;
            hero.y = hero.target.y;
        } else {
            hero.x += hero.speed * dx / mag;
            hero.y += hero.speed * dy / mag;
        }

        // Remove the target once they reach their destination.
        if (hero.x === hero.target.x && hero.y === hero.target.y) {
            delete hero.target;
        }
    } else {
        hero.target = {
            x: hero.r + Math.floor(Math.random() * (canvas.width - 2 * hero.r)),
            y: hero.r + Math.floor(Math.random() * (canvas.height - 2 * hero.r)),
        };
    }
}



function render() {
    // Erase the previous frame.
    context.clearRect(0, 0, canvas.width, canvas.height);

    renderHero(state);

    window.requestAnimationFrame(render);
}

function renderHero(state: GameState) {
    // Draw a circle for the hero centered at their location, with their radius and color.
    fillCircle(state.hero);

    if (state.hero.target) {
        fillCircle({
            ...state.hero.target,
            r: 2,
            color: 'blue',
        });
    }
}

function fillCircle(circle: Circle) {
    context.beginPath();
    context.arc(circle.x, circle.y, circle.r, 0, 2 * Math.PI);
    context.fillStyle = circle.color;
    context.fill();
}

window.requestAnimationFrame(render);
