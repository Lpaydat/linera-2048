<script lang="ts">
  import { queryStore, mutationStore, subscriptionStore, gql, getContextClient, cacheExchange, fetchExchange } from '@urql/svelte';
  import Header from "./Header.svelte";
  import { onMount } from "svelte";
  import Board from './Board.svelte';
  import MoveLogs from './MoveLogs.svelte';

  const GET_GAME_STATE = gql`
    query GetGameState($gameId: Int!) {
      game(gameId: $gameId) {
        gameId
        board
        score
        isEnded
  }
    }
  `;

  const NEW_GAME = gql`
    mutation NewGame($seed: Int!) {
      newGame(seed: $seed)
    }
  `;

  const MAKE_MOVE = gql`
    mutation MakeMove($gameId: ID!, $direction: String!) {
      makeMove(gameId: $gameId, direction: $direction)
    }
  `;

  const NOTIFICATION_SUBSCRIPTION = gql`
    subscription Notifications($chainId: ID!) {
      notifications(chainId: $chainId)
    }
  `;

  let client = getContextClient();
  let gameId = 5;

  const game = queryStore({
    client,
    query: GET_GAME_STATE,
    variables: { gameId },
    requestPolicy: 'network-only',
  });

  const newGameMutation = ({ seed }: {seed: number}) => {
    mutationStore({
      client,
      query: NEW_GAME,
      variables: { seed },
    })
  }

  enum Direction {
    Up = "Up",
    Down = "Down",
    Left = "Left",
    Right = "Right"
  }

  const makeMoveMutation = ({ gameId, direction }: {gameId: number, direction: string}) => {
    // Extract the direction part from the input (e.g., "ArrowUp" -> "Up")
    const formattedDirection = direction.replace('Arrow', '');
    
    if (!Object.values(Direction).includes(formattedDirection as Direction)) {
      console.error('Invalid direction:', direction);
      return;
    }
    
    mutationStore({
      client,
      query: MAKE_MOVE,
      variables: { gameId, direction: formattedDirection },
    })
  }

  const subscriptionId = '256e1dbc00482ddd619c293cc0df94d366afe7980022bb22d99e33036fd465dd';

  const messages = subscriptionStore({
    client,
    query: NOTIFICATION_SUBSCRIPTION,
    variables: { chainId: subscriptionId },
  })



  const newGame = () => {
    newGameMutation({ seed: gameId });
  };

  onMount(() => {
    newGame();
  });

  const handleKeydown = (event: KeyboardEvent) => {
    makeMoveMutation({ gameId, direction: event.key });
  };

  let blockHeight = 0;
  $: bh = $messages.data?.notifications?.reason?.NewBlock?.height;

  $: if (bh !== blockHeight) {
    blockHeight = bh;
    game.reexecute({ requestPolicy: 'network-only' });
  }

  $: rendered = false;
  $: if (!$game.fetching) {
    rendered = true;
  }

  let logs: { hash: string, timestamp: string }[] = [];
  let lastHash = ''
  $: if ($messages.data?.notifications?.reason?.NewBlock?.hash && lastHash !== $messages.data.notifications.reason.NewBlock.hash) {
    lastHash = $messages.data.notifications.reason.NewBlock.hash;
    logs = [ { hash: lastHash, timestamp: new Date().toISOString() }, ...logs];
  }

</script>

<svelte:window on:keydown={handleKeydown} />

<div class="game-container">
  <Header value={$game.data?.game?.score || 0} on:click={newGame} />
  {#if $game.fetching && !rendered}
    <p>Loading...</p>
  {:else}
    <div class="game-board">
      <Board board={$game.data?.game?.board} />
    </div>
  {/if}
</div>

<MoveLogs hashes={logs} />

<style>
  .game-container {
    max-width: 600px;
    margin: 0 auto;
    text-align: center;
  }

  .game-board {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 5px;
  }
</style>
