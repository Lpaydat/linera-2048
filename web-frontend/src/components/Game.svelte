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
  let gameId = 7;

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

  // Function to check if any tile on the board has reached 2048
  const hasWon = (board: number[][]) => {
    return board.some(row => row.includes(11));
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if ($game.data?.game?.isEnded) {
      return;
    }
    makeMoveMutation({ gameId, direction: event.key });
  };

  // Function to get the overlay message based on game status
  const getOverlayMessage = (board: number[][]) => {
    if (hasWon(board)) {
      return "Congratulations! You Won!";
    }
    return "Game Over! You Lost!";
  };
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="game-container">
  <Header value={$game.data?.game?.score || 0} on:click={newGame} />
  {#if $game.fetching && !rendered}
    <p>Loading...</p>
  {:else}
    <div class="game-board">
      <Board board={$game.data?.game?.board} />
      {#if $game.data?.game?.isEnded}
        <div class="overlay">
          <p>{getOverlayMessage($game.data?.game?.board)}</p>
        </div>
      {/if}
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
    position: relative;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
  }

  .overlay {
    position: absolute;
    font-weight: bold;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    border-radius: 6px;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.5em;
  }
</style>
