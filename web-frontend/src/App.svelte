<script lang="ts">
  const chainId = 'e476187f6ddfeb9d588c7b45d3df334d5501d6499b3f9ad5595cae86cce16a65';
  const applicationId = 'eac3fe3b25fd62b9082c198bce5da896b907be71a921142987e63dfea8f4abb6b25b5f3115b807e73e6ac1ee93ef49f835963958254d27e18db1271cf1b8a8bae476187f6ddfeb9d588c7b45d3df334d5501d6499b3f9ad5595cae86cce16a65010000000000000000000000';
  const port = '8080';

  import { setContextClient } from '@urql/svelte';
  import { getClient } from './lib/client';
  import Game from './components/Game.svelte';

  const client = getClient(chainId, applicationId, port);
  setContextClient(client);
</script>

<style>
  main {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    flex-direction: column;
    background-color: transparent;
  }

  h1 {
    font-size: 80px;
    margin: 0;
    padding-bottom: 20px;
    color: #776e65; /* Darker text color */
  }

  .game-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 556px;
    margin: 0 auto;
    background-color: #bbada0; /* Game board background */
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  }

  .credits {
    font-size: 16px;
    font-weight: bold;
    color: #776e65;
  }

  .credits .heart {
    color: red; /* Make the heart emoji red */
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    max-width: 556px;
    margin: 0 auto;
  }

  .title {
    font-size: 80px;
    margin: 0;
    padding-bottom: 20px;
    color: #776e65; /* Darker text color */
  }
</style>

<main>
  <div class="header">
    <h1 class="title">2048</h1>
    <span class="credits">made with <span class="heart">❤️</span>, lpaydat</span>
  </div>
  <div class="game-container">
    <Game />
  </div>
</main>
