function generateArrayOfNumbers(count) {
  const array = [];

  for (let i = 0; i < count; i++) {
    array.push(i * 2);
  }

  return array;
}

function binarySearch(arr, val) {
  let start = 0;
  let end = arr.length - 1;

  while (start <= end) {
    let mid = Math.floor((start + end) / 2);

    if (arr[mid] === val) {
      return true;
    }

    if (val < arr[mid]) {
      end = mid - 1;
    } else {
      start = mid + 1;
    }
  }
  return false;
}


function benchmark(count) {
  console.log('Benchark on array with %s elements', count);
  const array = generateArrayOfNumbers(count);
  const searchValue = array[array.length - 1] + 1;

  console.time('find');
  const res1 = array.find(n => n === searchValue) // O(n)
  console.timeEnd('find');

  console.time('includes');
  const res2 = array.includes(searchValue) // O(n)
  console.timeEnd('includes');

  console.time('binarySearch');
  const res3 = binarySearch(array, searchValue) // O(log(n))
  console.timeEnd('binarySearch');
  console.log('');
}


benchmark(10_000_000);
benchmark(10_000_000);
