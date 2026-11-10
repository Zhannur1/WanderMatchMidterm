$(function () {
    const defaultMemories = [
        {
            id: 1,
            place: "Madeira",
            date: "2026-05-18",
            rating: 5,
            memory: "I loved the mountain views and quiet coastal towns. My favorite part was walking near the ocean in the evening.",
            image: "images/story-madeira.jpg"
        },
        {
            id: 2,
            place: "Bali",
            date: "2025-08-12",
            rating: 4,
            memory: "This trip felt calm and colorful. I enjoyed the temples, local food and slower pace of the island.",
            image: "images/story-bali.jpg"
        },
        {
            id: 3,
            place: "Tokyo",
            date: "2025-03-09",
            rating: 5,
            memory: "Tokyo was busy but exciting. I liked how modern areas and traditional places felt completely different.",
            image: "images/story-tokyo.jpg"
        }
    ];

    let memories = loadMemories();
    let pendingDeleteId = null;
    let $lastDeleteButton = null;

    const $cards = $("#memoryCards");
    const $tableBody = $("#memoryTableBody");
    const $formPanel = $("#memoryFormPanel");
    const $form = $("#memoryForm");
    const $deleteOverlay = $("#deleteConfirmOverlay");

    function loadMemories() {
        try {
            const saved = localStorage.getItem("wanderMatchMemories");
            const loaded = saved ? JSON.parse(saved) : defaultMemories.slice();
            let changed = false;

            const normalized = loaded.map(function (memory) {
                if (!memory.image || memory.image.startsWith("data:image/")) {
                    return memory;
                }

                const destinationForImage = destinations.find(function (destination) {
                    return destination.image === memory.image;
                });

                if (
                    destinationForImage &&
                    destinationForImage.name.toLowerCase() !== String(memory.place).toLowerCase()
                ) {
                    changed = true;
                    return Object.assign({}, memory, { image: "" });
                }

                return memory;
            });

            if (changed) {
                localStorage.setItem("wanderMatchMemories", JSON.stringify(normalized));
            }

            return normalized;
        } catch (error) {
            return defaultMemories.slice();
        }
    }

    function saveMemories() {
        try {
            localStorage.setItem("wanderMatchMemories", JSON.stringify(memories));
            return true;
        } catch (error) {
            return false;
        }
    }

    function formatDate(dateString) {
        return new Date(dateString + "T00:00:00").toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    }

    function createMemoryMedia(memory) {
        if (memory.image) {
            return $("<img>")
                .attr("src", memory.image)
                .attr("alt", "Travel memory from " + memory.place);
        }

        return $("<div>")
            .addClass("memory-photo-placeholder")
            .attr({
                role: "img",
                "aria-label": "Neutral travel placeholder with an airplane"
            })
            .append($("<span>").addClass("memory-plane-icon").text("✈"))
            .append($("<span>").addClass("memory-placeholder-text").text("Travel memory"));
    }

    function renderMemories() {
        $cards.empty();
        $tableBody.empty();

        memories.forEach(function (memory) {
            const $card = $("<article>")
                .addClass("memory-card")
                .append(createMemoryMedia(memory))
                .append(
                    $("<div>")
                        .addClass("memory-text")
                        .append($("<h2>").text(memory.place))
                        .append($("<p>").addClass("memory-date").text("Visited " + formatDate(memory.date)))
                        .append($("<p>").text(memory.memory))
                        .append($("<p>").addClass("memory-rating").text("Rating: " + memory.rating + " / 5"))
                        .append(
                            $("<button>")
                                .attr("type", "button")
                                .addClass("delete-memory-button")
                                .attr("data-id", memory.id)
                                .text("Delete memory")
                        )
                );

            $cards.append($card);

            $tableBody.append(
                $("<tr>")
                    .append($("<th>").attr("scope", "row").text(memory.place))
                    .append($("<td>").text(memory.memory.slice(0, 55) + (memory.memory.length > 55 ? "…" : "")))
                    .append($("<td>").text(memory.rating + " / 5"))
                    .append($("<td>").text(formatDate(memory.date)))
            );
        });

        const average = memories.length
            ? memories.reduce(function (total, memory) {
                return total + Number(memory.rating);
            }, 0) / memories.length
            : 0;

        $("#memoryStats").text(
            memories.length + " memories · Average rating " + average.toFixed(1) + " / 5"
        );

        $("#memoryEmpty").prop("hidden", memories.length !== 0);
    }

    function resizeUploadedImage(file) {
        return new Promise(function (resolve, reject) {
            if (!file) {
                resolve("");
                return;
            }

            if (!file.type.startsWith("image/")) {
                reject(new Error("Choose a JPG, PNG or WebP image."));
                return;
            }

            const reader = new FileReader();

            reader.onerror = function () {
                reject(new Error("The image could not be read. Please choose another file."));
            };

            reader.onload = function (event) {
                const image = new Image();

                image.onerror = function () {
                    reject(new Error("The selected file is not a valid image."));
                };

                image.onload = function () {
                    const maxWidth = 1200;
                    const maxHeight = 800;
                    const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
                    const width = Math.round(image.width * scale);
                    const height = Math.round(image.height * scale);
                    const canvas = document.createElement("canvas");
                    const context = canvas.getContext("2d");

                    canvas.width = width;
                    canvas.height = height;
                    context.drawImage(image, 0, 0, width, height);

                    let dataUrl = canvas.toDataURL("image/jpeg", 0.82);

                    if (dataUrl.length > 1800000) {
                        dataUrl = canvas.toDataURL("image/jpeg", 0.65);
                    }

                    if (dataUrl.length > 2500000) {
                        reject(new Error("This photo is too large to store in the browser. Please choose a smaller image."));
                        return;
                    }

                    resolve(dataUrl);
                };

                image.src = event.target.result;
            };

            reader.readAsDataURL(file);
        });
    }

    function showActionStatus(message) {
        $("#memoryActionStatus")
            .stop(true, true)
            .hide()
            .text(message)
            .fadeIn(180)
            .delay(1400)
            .fadeOut(280);
    }

    function openDeleteConfirmation(id, place, $button) {
        pendingDeleteId = id;
        $lastDeleteButton = $button;
        $("#deleteMemoryName").text(place);

        $deleteOverlay
            .prop("hidden", false)
            .stop(true, true)
            .hide()
            .fadeIn(160, function () {
                $("#cancelDeleteMemory").trigger("focus");
            });
    }

    function closeDeleteConfirmation() {
        $deleteOverlay
            .stop(true, true)
            .fadeOut(140, function () {
                $deleteOverlay.prop("hidden", true);
                pendingDeleteId = null;

                if ($lastDeleteButton && $lastDeleteButton.length) {
                    $lastDeleteButton.trigger("focus");
                }

                $lastDeleteButton = null;
            });
    }

    $("#toggleMemoryForm").on("click", function () {
        if ($formPanel.prop("hidden")) {
            $formPanel.prop("hidden", false).hide();
        }

        $formPanel
            .stop(true, true)
            .slideToggle(250);
    });

    $form.on("submit", async function (event) {
        event.preventDefault();

        const place = $("#memory-place").val().trim();
        const date = $("#memory-date").val();
        const rating = Number($("#memory-rating").val());
        const text = $("#memory-text").val().trim();
        const file = $("#memory-image")[0].files[0];
        const $error = $("#memoryFormError");
        const $imageError = $("#memoryImageError");
        const $submit = $form.find('button[type="submit"]');

        $imageError.text("");

        if (place.length < 2 || !date || rating < 1 || rating > 5 || text.length < 10) {
            $error
                .stop(true, true)
                .text("Complete every field. Memory text must be at least 10 characters.")
                .fadeIn(180);
            return;
        }

        $error.hide().text("");
        $submit.prop("disabled", true).text("Saving…");

        try {
            const uploadedImage = await resizeUploadedImage(file);
            const newMemory = {
                id: Date.now(),
                place: place,
                date: date,
                rating: rating,
                memory: text,
                image: uploadedImage
            };

            memories.push(newMemory);

            if (!saveMemories()) {
                memories.pop();
                throw new Error("The browser storage is full. Try a smaller image or delete an old memory.");
            }

            renderMemories();
            this.reset();
            $("#memorySaved")
                .stop(true, true)
                .hide()
                .text(uploadedImage
                    ? "Memory saved with your photo in this browser."
                    : "Memory saved with a neutral travel placeholder.")
                .fadeIn(200)
                .delay(1400)
                .fadeOut(300);
        } catch (error) {
            $imageError.text(error.message);
        } finally {
            $submit.prop("disabled", false).text("Save Memory");
        }
    });

    $cards.on("click", ".delete-memory-button", function () {
        const id = Number($(this).attr("data-id"));
        const memory = memories.find(function (item) {
            return item.id === id;
        });

        if (!memory) {
            return;
        }

        openDeleteConfirmation(id, memory.place, $(this));
    });

    $("#cancelDeleteMemory").on("click", closeDeleteConfirmation);

    $("#confirmDeleteMemory").on("click", function () {
        if (pendingDeleteId === null) {
            return;
        }

        const deletedMemory = memories.find(function (memory) {
            return memory.id === pendingDeleteId;
        });

        memories = memories.filter(function (memory) {
            return memory.id !== pendingDeleteId;
        });

        saveMemories();
        renderMemories();

        $deleteOverlay
            .stop(true, true)
            .fadeOut(140, function () {
                $deleteOverlay.prop("hidden", true);
                pendingDeleteId = null;
                $lastDeleteButton = null;
                showActionStatus((deletedMemory ? deletedMemory.place : "Memory") + " was deleted.");
            });
    });

    $deleteOverlay.on("click", function (event) {
        if (event.target === this) {
            closeDeleteConfirmation();
        }
    });

    $(document).on("keydown", function (event) {
        if (event.key === "Escape" && !$deleteOverlay.prop("hidden")) {
            closeDeleteConfirmation();
        }
    });

    renderMemories();
});
