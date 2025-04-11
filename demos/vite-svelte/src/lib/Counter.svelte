<script lang="ts">
    let count: number = 0;
    const increment = () => {
        count += 1;
    };
</script>

<button on:click={increment}>
    count is {count}
</button>

<h1>test</h1>